export interface ApiUploadFileStateFormat<T>{
    progress: number;
    state: 'PENDING' | 'IN_PROGRESS' | 'DONE',
    data:T
}