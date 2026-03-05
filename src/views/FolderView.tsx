import { defineComponent, PropType, ref, computed, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import useAsync from '@/hooks/useAsync';
import napcat from '@/api/napcat';
import { DataTableColumns, NButton, NCheckbox, NDataTable, NFlex, NInput, NModal, NProgress, NSelect, NTime, useMessage } from 'naive-ui';
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

const fileTypeExtensionMap = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp', '.tiff', '.heic', '.heif'],
  video: ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.m4v', '.3gp'],
  audio: ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.ape', '.wma'],
  document: ['.txt', '.md', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv'],
  archive: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
} as const;

type FileTypeFilter = keyof typeof fileTypeExtensionMap | 'all' | 'other';

const fileTypeOptions: Array<{ label: string; value: FileTypeFilter }> = [
  { label: '全部类型', value: 'all' },
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
  { label: '音频', value: 'audio' },
  { label: '文档', value: 'document' },
  { label: '压缩包', value: 'archive' },
  { label: '其他', value: 'other' },
];

const getFileExtension = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) return '';
  return fileName.slice(dotIndex).toLowerCase();
};

const getFileType = (fileName: string): Exclude<FileTypeFilter, 'all'> => {
  const ext = getFileExtension(fileName);
  if (!ext) return 'other';

  for (const [fileType, extensions] of Object.entries(fileTypeExtensionMap) as Array<[
    Exclude<FileTypeFilter, 'all' | 'other'>,
    readonly string[],
  ]>) {
    if (extensions.includes(ext)) {
      return fileType;
    }
  }

  return 'other';
};

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
    const permanentOnly = ref(false);
    const fileTypeFilter = ref<FileTypeFilter>('all');
    const filesFlat = computed(() => {
      if (!files.data.value || !('folders' in files.data.value)) return [];

      const filteredFiles = files.data.value.files.filter(file => {
        if (permanentOnly.value && !!file.dead_time) {
          return false;
        }

        if (fileTypeFilter.value !== 'all') {
          const currentType = getFileType(file.file_name);
          if (currentType !== fileTypeFilter.value) {
            return false;
          }
        }

        return true;
      });

      return [...files.data.value.folders, ...filteredFiles];
    });
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
          minWidth: 300,
          sorter(a, b) {
            const aIsFolder = 'folder_name' in a;
            const bIsFolder = 'folder_name' in b;
            if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
            const aName = aIsFolder ? (a as NapcatFolder).folder_name : (a as NapcatFile).file_name;
            const bName = bIsFolder ? (b as NapcatFolder).folder_name : (b as NapcatFile).file_name;
            return aName.localeCompare(bName);
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
          minWidth: 200,
          sorter(a, b) {
            const aIsFolder = 'folder_name' in a;
            const bIsFolder = 'folder_name' in b;
            if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
            const aName = aIsFolder ? (a as NapcatFolder).creator_name : (a as NapcatFile).uploader_name;
            const bName = bIsFolder ? (b as NapcatFolder).creator_name : (b as NapcatFile).uploader_name;
            return aName.localeCompare(bName);
          },
          filterOptions: (() => {
            const names = new Map<number, string>();
            for (const row of filesFlat.value || []) {
              if ('folder_name' in row) {
                names.set(row.creator, row.creator_name);
              } else {
                names.set(row.uploader, row.uploader_name);
              }
            }
            return Array.from(names.entries()).map(([id, name]) => ({
              label: `${name} (${id})`,
              value: id,
            }));
          })(),
          filter(value, row) {
            if ('folder_name' in row) return row.creator === value;
            return row.uploader === value;
          },
        },
        {
          title: '大小', key: 'size',
          render(row) {
            if ('folder_name' in row)
              return `${row.total_file_count} 项`;
            return hSize(row.size ?? row.file_size);
          },
          minWidth: 110,
          width: 110,
          maxWidth: 110,
          sorter(a, b) {
            const aIsFolder = 'folder_name' in a;
            const bIsFolder = 'folder_name' in b;
            if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
            if (aIsFolder && bIsFolder) return (a as NapcatFolder).total_file_count - (b as NapcatFolder).total_file_count;
            return ((a as NapcatFile).size ?? (a as NapcatFile).file_size) - ((b as NapcatFile).size ?? (b as NapcatFile).file_size);
          },
          filterOptions: [
            { label: '< 1 MB', value: 'lt1m' },
            { label: '1 - 10 MB', value: '1m-10m' },
            { label: '10 - 100 MB', value: '10m-100m' },
            { label: '100 MB - 1 GB', value: '100m-1g' },
            { label: '> 1 GB', value: 'gt1g' },
          ],
          filter(value, row) {
            if ('folder_name' in row) return true;
            const size = (row as NapcatFile).size ?? (row as NapcatFile).file_size;
            const MB = 1024 * 1024;
            const GB = 1024 * 1024 * 1024;
            switch (value) {
              case 'lt1m': return size < MB;
              case '1m-10m': return size >= MB && size < 10 * MB;
              case '10m-100m': return size >= 10 * MB && size < 100 * MB;
              case '100m-1g': return size >= 100 * MB && size < GB;
              case 'gt1g': return size >= GB;
              default: return true;
            }
          },
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
          minWidth: 180,
          width: 180,
          maxWidth: 180,
          sorter(a, b) {
            const aIsFolder = 'folder_name' in a;
            const bIsFolder = 'folder_name' in b;
            if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
            if (aIsFolder && bIsFolder) return 0;
            const aDead = (a as NapcatFile).dead_time;
            const bDead = (b as NapcatFile).dead_time;
            if (!aDead && !bDead) return 0;
            if (!aDead) return 1;
            if (!bDead) return -1;
            return aDead - bDead;
          },
        },
        {
          title: '时间', key: 'upload_time',
          render(row) {
            if ('folder_name' in row)
              return <NTime time={row.create_time * 1000} />;
            return <NTime time={row.modify_time * 1000} />;
          },
          minWidth: 180,
          width: 180,
          maxWidth: 180,
          sorter(a, b) {
            const aIsFolder = 'folder_name' in a;
            const bIsFolder = 'folder_name' in b;
            if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
            const aTime = aIsFolder ? (a as NapcatFolder).create_time : (a as NapcatFile).modify_time;
            const bTime = bIsFolder ? (b as NapcatFolder).create_time : (b as NapcatFile).modify_time;
            return aTime - bTime;
          },
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


    return () => <NFlex vertical class="mx-2">
      <NFlex class="mt-2" align="center">
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
        <NCheckbox v-model:checked={permanentOnly.value}>
          仅永久文件
        </NCheckbox>
        <NSelect
          value={fileTypeFilter.value}
          options={fileTypeOptions}
          onUpdateValue={value => fileTypeFilter.value = value as FileTypeFilter}
          class="w-40"
        />
      </NFlex>
      <NDataTable
        columns={columns.value}
        data={filesFlat.value || []}
        v-model:checkedRowKeys={selectedIds.value}
        loading={files.loading.value || filesRoot.loading.value}
        maxHeight="90vh"
        virtualScroll
        scrollX={1200}
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
