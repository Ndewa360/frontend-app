export interface ApiUploadFileStateFormat<T>{
    progress: number;
    state: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'FAILED',
    /** Motif d'échec (FAILED). */
    error?: string;
    data:T
}