
export enum FileUploadContentType {
    FOR_USER_FILE="for_user_file",
    FOR_ROOM_FILE="for_room_file"
}


export interface UploadFilesModel {

    contentType: FileUploadContentType

    contentID:string;

    file:File
}