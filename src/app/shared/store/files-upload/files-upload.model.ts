
export enum FileUploadContentType {
    FOR_USER_FILE="for_user_file",
    FOR_ROOM_FILE="for_room_file"
}

export enum ContentUploadRoomType {
    FOR_ROOM="for_room",
    FOR_PROPERTY="for_property"
}

export interface UploadFilesModel {

    contentType: FileUploadContentType

    contentID:string;

    file:File

    contentRoomType: ContentUploadRoomType
}

export interface RemovedUploadFileModel {

    contentType: FileUploadContentType

    contentID:string;

    fileUrl:string

    contentRoomType: ContentUploadRoomType
}

