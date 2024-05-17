import COS from 'cos-nodejs-sdk-v5';
import {__TC_BUCKET_NAME__, __TC_REGION__, __TC_ID__, __TC_KEY__} from "../../global.config";

const cos = new COS({
    SecretId: __TC_ID__,
    SecretKey: __TC_KEY__
})

type UploadFile = {
    filePath: string,
    name: string,
    targetPath: string
}


export async function uploadFile(file: UploadFile) {
    return new Promise<string>((resolve, reject) => {
        cos.uploadFile({
            Bucket: __TC_BUCKET_NAME__, /* 填入您自己的存储桶，必须字段 */
            Region: __TC_REGION__,  /* 存储桶所在地域，例如 ap-beijing，必须字段 */
            Key: `${file.targetPath}${file.name}`,  /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */
            FilePath: file.filePath,                /* 必须 */
            SliceSize: 1024 * 1024 * 5,     /* 触发分块上传的阈值，超过5MB使用分块上传，非必须 */
        }, function (err, data) {
            if (err) {
                reject(err.message);
            } else {
                resolve(data.Location);
            }
        });
    })
}

export async function uploadFiles(files: UploadFile[]) {
    return new Promise<string[]>((resolve, reject) => {
        cos.uploadFiles({
            files: files.map(f => ({
                Bucket: __TC_BUCKET_NAME__, /* 填入您自己的存储桶，必须字段 */
                Region: __TC_REGION__,  /* 存储桶所在地域，例如 ap-beijing，必须字段 */
                Key: `${f.targetPath}${f.name}`,  /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */
                FilePath: f.filePath
            })),
            SliceSize: 1024 * 1024 * 5,     /* 触发分块上传的阈值，超过5MB使用分块上传，非必须 */
        }, function (err, data) {
            if (err) {
                reject(err.message);
            } else {
                resolve(data.files.map(f => f.data.Location));
            }
        });
    })
}

export async function deleteFiles(filePaths: string[]) {
    return new Promise((resolve, reject) => {
        cos.deleteMultipleObject({
            Bucket: __TC_BUCKET_NAME__, /* 填入您自己的存储桶，必须字段 */
            Region: __TC_REGION__,  /* 存储桶所在地域，例如 ap-beijing，必须字段 */
            Objects: filePaths.map(f => ({Key: f})),  /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */
        }, function (err, data) {
            if (err) {
                reject(err.message);
            } else {
                resolve("success");
            }
        });
    })

}