import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadFile = async (filepath: string, file: File) => {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filenameArr = file.name.split('.');
    const filename = Date.now() + "." + filenameArr[filenameArr.length - 1];
    const publicId = `${filepath}/${filename}`;

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: 'clothify',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return result.secure_url;
  } catch (error) {
    console.log("Error to upload file", error);
    return null;
  }
}
