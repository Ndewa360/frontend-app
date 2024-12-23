import { PropertyModel } from "../properties";
import { RoomModel } from "../rooms";

export interface SearchPropertyModel extends PropertyModel {
    rooms:RoomModel[]
}