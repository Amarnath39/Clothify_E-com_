export const generateRandomId = (length: number) => {
    const myStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let uuid = "";
    for (let i = 0; i < length; i++) {
        const p = Math.floor(Math.random()*myStr.length);
        const el = myStr[p];
        uuid += el;
    }
    return uuid;
}