export interface NapcatFile {
  group_id: number;
  file_id: string;
  file_name: string;
  busid: number;
  size: number;
  file_size: number;
  upload_time: number;
  dead_time: number;
  modify_time: number;
  download_times: number;
  uploader: number;
  uploader_name: string;
}

export interface NapcatFolder {
  group_id: number;
  folder_id: string;
  folder: string;
  folder_name: string;
  create_time: number;
  creator: number;
  creator_name: string;
  total_file_count: number;
}
