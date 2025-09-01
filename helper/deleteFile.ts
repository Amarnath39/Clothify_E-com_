import { existsSync } from "fs";
import { rm } from "fs/promises";
import path from "path";

export const deleteFile = async (filePath: string) => {
    try {
        const dirPath = path.join(process.cwd(), `public/${filePath}`);
        if (existsSync(dirPath)) {
            await rm(dirPath, { recursive: true });
        }
        return true;
    } catch (error) {
        console.log("Error to delete file", error);
        return false;
    }
}