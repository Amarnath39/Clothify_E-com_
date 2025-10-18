import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const uploadFile = async (filepath: string, file: File) => {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filenameArr = file.name.split('.');
    const filename = Date.now() + "." + filenameArr[filenameArr.length - 1];
    const dirPath = path.join(process.cwd(), `public/assets/${filepath}`);
    console.log(filename);
    try {
        if (!existsSync(dirPath)) {
            await mkdir(dirPath, { recursive: true });
        }
        await writeFile(path.join(dirPath, filename), buffer);
        return `/assets/${filepath}/${filename}`;
    } catch (error) {
        console.log("Error to upload file", error);
        return null;
    }
}