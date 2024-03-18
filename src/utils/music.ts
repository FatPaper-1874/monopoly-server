import {login_cellphone, playlist_detail, song_detail, song_url, user_playlist} from "NeteaseCloudMusicApi";

type MusicType = {
    id: string,
    name: string,
    url: string,
    exp: number,
    picUrl: string
}

let uid = "";
let playListName = "";
let musicList: MusicType[] | undefined = void 0;

export async function getMusicList() {
    if (!musicList || musicList.some((m) => Date.now() >= m.exp)) {
        musicList = await loadMusicList();
    }
    return musicList;
}

// https://music.163.com/song/media/outer/url?id=id.mp3
async function getMusicUrls(ids: number[]) {
    const res = await song_url({id: ids.join(',')});
    const data = res.body.data as any;
    if (!data || !(data instanceof Array)) {
        throw new Error("获取音乐url列表时发生错误")
    }
    return data;
}

async function loginNeteaseCloudMusic(phone: string, password: string) {
    return await login_cellphone({phone, password});
}

async function getMyMusicList(uid: string) {
    if (uid) {
        const res = await user_playlist({uid});
        const data = res.body as any;
        return data.playlist;
    } else {
        throw new Error("还没有登录就调用getMyMusicList")
    }
}

async function getPlayListMusicIdList(id: string) {
    const res = await playlist_detail({id});
    const data = res.body as any;
    const musicList = data.playlist.trackIds as any[];
    return musicList.map(m => m.id) as number[];
}

async function getMusicDetails(idList: number[]) {
    const res = await song_detail({ids: idList.join(',')});
    const data = res.body;
    return data.songs;
}

async function loadMusicList() {
    const playlist = await getMyMusicList(uid) as any[];
    const {id} = playlist.find(pl => pl.name === playListName);
    const musicIdList = await getPlayListMusicIdList(id);
    console.log(musicIdList)
    const musicDetailList = await getMusicDetails(musicIdList);
    console.log(musicDetailList)
    const musicUrlList = await getMusicUrls(musicIdList);
    console.log(musicUrlList)
    const _musicList = musicIdList.map((id) => {
        const detail = musicDetailList.find(d => d.id === id);
        const name = detail ? detail.name : "";
        const picUrl = detail ? detail.al.picUrl : "";
        const music = musicUrlList.find((m: any) => m.id === id);
        const url = music ? music.url as string : `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
        const exp = Date.now() + 10 * 1000;
        // const exp = music ? Date.now() + music.expi * 1000 : Date.now() + 1200 * 1000;
        const _tempMusic: MusicType = {
            id: id + "",
            url,
            name,
            picUrl,
            exp
        }
        return _tempMusic
    });

    return _musicList;
}

export async function initNeteaseCloudMusic(phone: string, password: string, _playListName: string) {
    try {
        const res = await loginNeteaseCloudMusic(phone, password);
        const data = res.body as any;
        uid = data.account.id;
        playListName = _playListName;
        musicList = await loadMusicList();
    } catch (e: any) {
        console.error(e);
    }
}