import {encryptAES} from '../src/utils/crypto/aes-256';

const encryptPasswordData = async (data: {
  name: string;
  username: string;
  password: string;
  url: string;
}) => {
  const [encryptedName, encryptedUsername, encryptedPassword, encryptedURL] = await Promise.all([
    encryptAES(JSON.stringify(data.name), process.env.SYMMETRIC_KEY_PASSPHRASE as string),
    encryptAES(JSON.stringify(data.username), process.env.SYMMETRIC_KEY_PASSPHRASE as string),
    encryptAES(JSON.stringify(data.password), process.env.SYMMETRIC_KEY_PASSPHRASE as string),
    data.url
      ? encryptAES(JSON.stringify(data.url), process.env.SYMMETRIC_KEY_PASSPHRASE as string)
      : Promise.resolve(undefined)
  ]);

  return {
    encryptedName,
    encryptedUsername,
    encryptedPassword,
    encryptedURL
  };
};

if (require.main === module) {
  (async () => {
    // get the data from arguments
    const data = {
      name: process.argv[2],
      username: process.argv[3],
      password: process.argv[4],
      url: process.argv[5]
    };

    // encrypt the data
    const encryptedData = await encryptPasswordData(data);
    console.log('\nEncrypted Data:');
    for (const [key, value] of Object.entries(encryptedData)) {
      console.log(`"${key.replace('encrypted', '').toLowerCase()}": ${JSON.stringify(value)},`);
    }
  })();
}
