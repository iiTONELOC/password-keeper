import {Schema} from 'mongoose';
import {IEncryptedData} from 'passwordkeeper.types';

// Define the EncryptedData Schema only
export const EncryptedDataSchema = new Schema<IEncryptedData>(
  {
    encryptedData: {
      type: String,
      required: true
    },
    iv: {
      type: String,
      required: true
    }
  },
  {id: false, _id: false, timestamps: false}
);

export default EncryptedDataSchema;
