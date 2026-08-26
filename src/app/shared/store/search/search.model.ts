import { PropertyModel } from '../properties';
import { RoomModel } from '../rooms';

export interface SearchRoomOwner {
  _id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  userType?: string;
}

export interface SearchRoomManagedByAgent {
  _id: string;
  fullName?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  agencyName?: string;
  company?: string;
  agencyLogo?: string;
  logo?: string;
  agencyPhone?: string;
  userType?: string;
}

export interface SearchRoomProperty extends Omit<PropertyModel, 'owner' | 'managedByAgent'> {
  owner?: SearchRoomOwner;
  managedByAgent?: SearchRoomManagedByAgent;
}

export interface SearchPropertyModel extends RoomModel {
  property: SearchRoomProperty;
}