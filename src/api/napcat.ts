import { apiAddress } from '@/store/refs';
import { NapcatFile, NapcatFolder } from '@/types';

const baseFetch = async (action: string, params: any = {}) => {
  const req = await fetch(apiAddress.value + '/' + action, {
    method: 'POST',
    body: JSON.stringify(params),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  if (req.status !== 200) {
    throw new Error('请求失败');
  }
  const res = await req.json();
  if (res.retcode !== 0) {
    throw new Error(res.message);
  }
  return res.data;
};

export default {
  async getGroups() {
    return await baseFetch('get_group_list') as Array<{
      group_remark: string;
      'group_id': number,
      'group_name': string,
      'member_count': number,
      'max_member_count': number,
    }>;
  },
  async getMe() {
    return await baseFetch('get_login_info') as {
      'user_id': number,
      'nickname': string,
    };
  },
  async getMemberInfo(group_id: number | string, user_id: number | string, no_cache = false) {
    return await baseFetch('get_group_member_info', { group_id, user_id, no_cache }) as {
      group_id: number;
      user_id: number;
      nickname: string;
      card: string;
      sex: string;
      age: number;
      area: string;
      level: string;
      qq_level: number;
      join_time: number;
      last_sent_time: number;
      title_expire_time: number;
      unfriendly: boolean;
      card_changeable: boolean;
      is_robot: boolean;
      shut_up_timestamp: number;
      role: string;
      title: string;
    };
  },
  async getRootFiles(group_id: number | string) {
    return await baseFetch('get_group_root_files', { group_id }) as {
      files: NapcatFile[];
      folders: NapcatFolder[];
    };
  },
  async getDirFiles(group_id: number | string, folder_id: string, file_count = 2147483647) {
    return await baseFetch('get_group_files_by_folder', { group_id, folder_id, file_count }) as {
      files: NapcatFile[];
      folders: NapcatFolder[];
    };
  },
  async renameFile(group_id: number | string, file_id: string, current_parent_directory: string, new_name: string) {
    return await baseFetch('rename_group_file', { group_id, file_id, current_parent_directory, new_name }) as {
      ok: true
    };
  },
  async moveFile(group_id: number | string, file_id: string, current_parent_directory: string, target_parent_directory: string) {
    return await baseFetch('move_group_file', {
      group_id,
      file_id,
      current_parent_directory,
      target_parent_directory,
    }) as {
      ok: true
    };
  },
  // 转永久
  async transFile(group_id: number | string, file_id: string) {
    return await baseFetch('trans_group_file', { group_id, file_id }) as {
      ok: true
    };
  },
  async createFolder(group_id: number | string, folder_name: string) {
    return await baseFetch('create_group_file_folder', { group_id, folder_name }) as {};
  },
  async deleteFolder(group_id: number | string, folder_name: string) {
    return await baseFetch('delete_group_folder', { group_id, folder_name }) as {};
  },
  async deleteFile(group_id: number | string, file_id: string) {
    return await baseFetch('delete_group_file', { group_id, file_id }) as {};
  },
  async getFileUrl(group_id: number | string, file_id: string) {
    return await baseFetch('get_group_file_url', { group_id, file_id }) as {
      url: string
    };
  },
};
