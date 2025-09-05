import { defineComponent, PropType, ref, computed, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import useAsync from '@/hooks/useAsync';
import napcat from '@/api/napcat';
import { DataTableColumns, NButton, NDataTable, NFlex, NInput, NModal, NProgress, NTime, useMessage } from 'naive-ui';
import { NapcatFile, NapcatFolder } from '@/types';
import hSize from '@/utils/hSize';
import { myInfo } from '@/store/refs';
import { MediaPreviewType } from '@/enums';
import MediaPreviewDialog from '@/components/MediaPreviewDialog';

const previewTypes = [
  [MediaPreviewType.Image, ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp', '.tiff']],
  [MediaPreviewType.Video, ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.mkv', '.wmv']],
  [MediaPreviewType.Audio, ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a']],
] as const;

export default defineComponent({
  // props: {
  // },
  setup(props, { emit }) {
    const message = useMessage();

    const route = useRoute();
    const router = useRouter();
    const groupId = computed(() => Number(route.params.groupId));
    const folderId = computed(() => route.params.folderId as string);

    const filesRoot = useAsync(async () => {
      if (!groupId.value) return [];
      return await napcat.getRootFiles(groupId.value);
    });

    const files = useAsync(async () => {
      if (!groupId.value) return [];
      if (filesRoot.loading.value) return [];
      if (!folderId.value) return filesRoot.data.value;
      return await napcat.getDirFiles(groupId.value, '/' + folderId.value);
    });

    const myMember = useAsync(async () => {
      if (!groupId.value) return null;
      if (!myInfo.data.value || !myInfo.data.value.user_id) return null;
      return await napcat.getMemberInfo(groupId.value, myInfo.data.value?.user_id);
    });

    const isAdmin = computed(() => {
      if (!myMember.data.value) return false;
      return myMember.data.value.role === 'admin' || myMember.data.value.role === 'owner';
    });
    const filesFlat = computed(() => files.data.value && 'folders' in files.data.value && [...files.data.value.folders, ...files.data.value.files]);
    const selectedIds = ref<string[]>([]);
    const renameFileId = ref<string | null>(null);
    const inputFileName = ref<string | null>(null);
    const moveTarget = ref<string[]>([]);
    const previewType = ref(MediaPreviewType.None);
    const previewUrl = ref('');

    watch(() => route.params, () => {
      selectedIds.value = [];
      moveTarget.value = [];
    }, { deep: true });

    const columns = computed<DataTableColumns<NapcatFile | NapcatFolder>>(() => {
      const res: DataTableColumns<NapcatFile | NapcatFolder> = [];
      if (isAdmin.value) {
        res.push({
          type: 'selection',
          disabled(row) {
            return 'folder_name' in row;
          },
        });
      }
      res.push({
          title: '名称', key: 'name',
          render(row) {
            if ('folder_name' in row)
              return <RouterLink
                to={{
                  name: 'groupFolder', params: { groupId: groupId.value, folderId: row.folder_id.substring(1) },
                }} class={'c-blue-7'}
              >
                <div class="flex gap-1 items-center">
                  <div class={'i-material-symbols:folder-outline c-gray-5'} />
                  {row.folder_name}
                </div>
              </RouterLink>;
            const preview = previewTypes.find(it => it[1].some(ext => row.file_name.toLowerCase().endsWith(ext)));
            return <div class="flex gap-1 items-center">
              <div
                class={'c-blue-7 cursor-pointer'}
                onClick={async () => {
                  napcat.getFileUrl(groupId.value, row.file_id)
                    .then(({ url }) => {
                      const u = new URL(url);
                      u.searchParams.set('fname', row.file_name);
                      const a = document.createElement('a');
                      a.href = u.toString();
                      a.download = row.file_name;
                      a.click();
                    })
                    .catch(err => {
                      message.error(err.message);
                    });
                }}
              >
                {row.file_name}
              </div>
              {preview && <div
                class={'i-icon-park-outline:preview-open c-gray-5'}
                onClick={async () => {
                  napcat.getFileUrl(groupId.value, row.file_id)
                    .then(({ url }) => {
                      previewUrl.value = url;
                      previewType.value = preview[0];
                    })
                    .catch(err => {
                      message.error(err.message);
                    });
                }}
              />}
            </div>;
          },
          resizable: true,
          ellipsis: {
            tooltip: true,
          },
        },
        {
          title: '创建者', key: 'uploader_name',
          render(row) {
            if ('folder_name' in row)
              return `${row.creator_name} (${row.creator})`;
            return `${row.uploader_name} (${row.uploader})`;
          },
          // resizable: true,
          ellipsis: {
            tooltip: true,
          },
        },
        {
          title: '大小', key: 'size',
          render(row) {
            if ('folder_name' in row)
              return `${row.total_file_count} 项`;
            return hSize(row.size);
          },
          minWidth: 120,
          width: 120,
          maxWidth: 120,
        },
        {
          title: '有效期', key: 'dead_time',
          render(row) {
            if ('folder_name' in row)
              return `-`;
            if (row.dead_time)
              return <div
                class={[isAdmin.value && 'cursor-pointer c-blue-6']}
                onClick={() => {
                  if (!isAdmin.value) return false;
                  napcat.transFile(groupId.value, row.file_id)
                    .then(() => {
                      message.success('转存永久成功');
                      files.refresh();
                      filesRoot.refresh();
                    })
                    .catch(err => message.error(err.message));
                }}
              >
                <NTime time={row.dead_time * 1000} />
              </div>;
            return '永久';
          },
          minWidth: 220,
          width: 220,
          maxWidth: 220,
        },
        {
          title: '时间', key: 'upload_time',
          render(row) {
            if ('folder_name' in row)
              return <NTime time={row.create_time * 1000} />;
            return <NTime time={row.modify_time * 1000} />;
          },
          minWidth: 220,
          width: 220,
          maxWidth: 220,
        },
      );
      if (isAdmin.value) {
        res.push({
          title: '操作', key: 'actions',
          render(row) {
            const deleteConfirm = ref(false);
            const deleteLoading = ref(false);

            return <NFlex>
              <NButton
                secondary loading={deleteLoading.value} type={deleteConfirm.value ? 'error' : 'default'}
                // @ts-ignore
                onMouseleave={() => deleteConfirm.value = false}
                onClick={() => {
                  if (!deleteConfirm.value) {
                    deleteConfirm.value = true;
                    return;
                  }
                  deleteConfirm.value = false;
                  deleteLoading.value = true;

                  ('folder_name' in row ? napcat.deleteFolder(groupId.value, row.folder_id) : napcat.deleteFile(groupId.value, row.file_id))
                    .then(() => {
                      message.success('删除成功');
                      files.refresh();
                      filesRoot.refresh();
                    })
                    .catch(err => message.error(err.message))
                    .finally(() => deleteLoading.value = false);
                }}
              >
                {deleteConfirm.value ? '确认' : '删除'}
              </NButton>
              {'file_id' in row && <NButton
                secondary onClick={() => {
                renameFileId.value = row.file_id;
                inputFileName.value = row.file_name;
              }}
              >
                重命名
              </NButton>}
            </NFlex>;
          },
          width: 240,
        });
      }
      return res;
    });

    const moveProgress = ref(-1);
    const showMoveTarget = ref(false);
    const deleteConfirm = ref(false);
    const deleteLoading = ref(false);
    const showNewFolder = ref(false);


    return () => <NFlex vertical class={'py-2 pr-2'}>
      <NFlex>
        {!!folderId.value &&
          <NButton secondary onClick={() => router.push({ name: 'groupRoot', params: { groupId: groupId.value } })}>
            返回根目录
          </NButton>}
        {isAdmin.value && <>
          <NButton secondary disabled={!selectedIds.value.length} onClick={() => showMoveTarget.value = true}>
            批量移动
          </NButton>
          <NButton
            secondary disabled={!selectedIds.value.length}
            loading={deleteLoading.value} type={deleteConfirm.value ? 'error' : 'default'}
            // @ts-ignore
            onMouseleave={() => deleteConfirm.value = false}
            onClick={async () => {
              if (!deleteConfirm.value) {
                deleteConfirm.value = true;
                return;
              }
              deleteConfirm.value = false;
              deleteLoading.value = true;
              moveProgress.value = 0;
              for (let i = 0; i < selectedIds.value.length; i++) {
                const fileId = selectedIds.value[i];
                await napcat.deleteFile(groupId.value, fileId)
                  .catch(err => message.error(err.message));
                moveProgress.value = Math.round((i + 1) / selectedIds.value.length * 100);
              }
              moveProgress.value = -1;
              selectedIds.value = [];
              deleteLoading.value = false;
              files.refresh();
              filesRoot.refresh();
            }}
          >
            {deleteConfirm.value ? '确认删除' : '批量删除'}
          </NButton>
          {!folderId.value && <NButton
            secondary onClick={() => {
            showNewFolder.value = true;
            inputFileName.value = null;
          }}
          >
            新建文件夹
          </NButton>}
        </>}
      </NFlex>
      <NDataTable
        columns={columns.value}
        data={filesFlat.value || []}
        v-model:checkedRowKeys={selectedIds.value}
        loading={files.loading.value || filesRoot.loading.value}
        maxHeight="90vh"
        virtualScroll
        rowKey={(row) => {
          if ('folder_name' in row)
            return row.folder_id;
          return row.file_id;
        }}
      />
      <NModal
        preset="card"
        class="w-[min(80vw,60em)]"
        title="请输入新的文件名"
        show={!!renameFileId.value}
        onUpdateShow={() => renameFileId.value = null}
      >{{
        default: () => <NInput v-model:value={inputFileName.value} />,
        footer: () => <NFlex justify="end">
          <NButton
            onClick={() => {
              const fileId = renameFileId.value!;
              renameFileId.value = null;
              napcat.renameFile(groupId.value, fileId, folderId.value ? '/' + folderId.value : '/', inputFileName.value!)
                .then(() => {
                  message.success('重命名成功');
                  files.refresh();
                  filesRoot.refresh();
                })
                .catch(err => message.error(err.message));
            }}
          >确定</NButton>
        </NFlex>,
      }}</NModal>
      <NModal
        preset="card"
        class="w-[min(80vw,60em)]"
        title="请输入新文件夹的名字"
        v-model:show={showNewFolder.value}
      >{{
        default: () => <NInput v-model:value={inputFileName.value} />,
        footer: () => <NFlex justify="end">
          <NButton
            disabled={!inputFileName.value}
            onClick={() => {
              showNewFolder.value = false;
              napcat.createFolder(groupId.value, inputFileName.value!)
                .then(() => {
                  message.success('创建成功');
                  files.refresh();
                  filesRoot.refresh();
                })
                .catch(err => message.error(err.message));
            }}
          >确定</NButton>
        </NFlex>,
      }}</NModal>
      <NModal
        preset="card"
        class="w-[min(80vw,60em)]"
        title="选择目标文件夹"
        v-model:show={showMoveTarget.value}
      >{{
        default: () => <NDataTable
          columns={[
            {
              type: 'selection',
              multiple: false,
            },
            {
              title: '名称', key: 'folder_name',
            },
            {
              title: '子文件数量', key: 'total_file_count', width: 100,
            },
          ]}
          data={[
            { folder_name: '根目录', folder_id: '/', total_file_count: '-' },
            ...((filesRoot.data.value as any)?.folders || []),
          ]}
          onUpdateCheckedRowKeys={keys => moveTarget.value = keys as string[]}
          rowKey={row => row.folder_id}
          maxHeight="60vh"
        />,
        footer: () => <NFlex justify="end">
          <NButton
            disabled={!moveTarget.value.length}
            onClick={async () => {
              showMoveTarget.value = false;
              moveProgress.value = 0;
              for (let i = 0; i < selectedIds.value.length; i++) {
                const fileId = selectedIds.value[i];
                await napcat.moveFile(groupId.value, fileId, folderId.value ? '/' + folderId.value : '/', moveTarget.value[0])
                  .catch(err => message.error(err.message));
                moveProgress.value = Math.round((i + 1) / selectedIds.value.length * 100);
              }
              selectedIds.value = [];
              moveProgress.value = -1;
              files.refresh();
              filesRoot.refresh();
            }}
          >确定</NButton>
        </NFlex>,
      }}</NModal>
      <NModal
        preset="card"
        class="w-[min(80vw,60em)]"
        title="批量操作"
        show={moveProgress.value !== -1}
        closeOnEsc={false}
        closable={false}
        maskClosable={false}
      >
        <NProgress type="line" indicator-placement="inside" percentage={moveProgress.value} />
      </NModal>
      <MediaPreviewDialog v-model:type={previewType.value} url={previewUrl.value} />
    </NFlex>;
  },
});
