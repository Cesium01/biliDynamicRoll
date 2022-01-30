//作者：Cesium
//联系方式：B站“顶碗人周报”或“向晚而生_”
//使用方法：在动态页面打开网页控制台，粘贴以下代码回车，输入roll(m,x)，再按回车。
//          x为中奖人数；m为抽奖模式，0=>仅转发，1=>仅回复，2=>回复或转发

let userMap = new Map();
let dynamicId = "";
var reg =/https\:\/\/t.bilibili.com\/(\d+)/;
dynamicId = window.location.href.match(reg)[1];

const repostApi = "https://api.vc.bilibili.com/dynamic_repost/v1/dynamic_repost/repost_detail?dynamic_id=";

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getApi(url){
    const response = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        headers: {
            DNT: "1",
            Accept: "application/json, text/plain, */*",
            Referer: "https://t.bilibili.com/"
        }
    });
    const result = await response.json();
    if (0 != result["code"])
        throw new Error(JSON.stringify(result));
    return result["data"];
}

async function getReposts(offset=""){
    var url = ""==offset ? repostApi+dynamicId : repostApi+dynamicId+"&offset="+offset;
    var data = await getApi(url);
    var reposts = data["items"];
    if(reposts){
        for(let i=0;i<reposts.length;i++){
            userMap.set(reposts[i]["desc"]["uid"], reposts[i]["desc"]["user_profile"]["info"]["uname"]);
        }
    }
    if(data["has_more"]){
        sleep(50);
        getReposts(data["offset"]);
    }
}

async function getDynamicDetail(dynId){
    var data = await getApi("https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/get_dynamic_detail?dynamic_id="+dynId);
    var type = "17";
    var oid = dynId;
    if("2"==data["card"]["desc"]["type"].toString()){
        type = "11";
        oid = data["card"]["desc"]["rid"];
    }
    return "https://api.bilibili.com/x/v2/reply/main?jsonp=jsonp&type="+type+"&oid="+oid+"&mode=3&plat=1";
}

const replyApi = await getDynamicDetail(dynamicId);

async function getReplies(next="0"){
    var url = replyApi+"&next="+next+"&_="+(new Date().getTime()).toString();
    var data = await getApi(url);
    var cursor = data["cursor"];
    var replies = data["replies"];
    if(replies){
        for(let i=0;i<replies.length;i++){
            userMap.set(replies[i]["mid"], replies[i]["member"]["uname"]);
        }
    }
    if(!cursor["is_end"]){
        sleep(50);
        getReplies(cursor["next"].toString());
    }
}

async function roll(mode=0, number=1){
    userMap.clear();
    switch(mode){
        case 0:
            await getReposts();
            break;
        case 1:
            await getReplies();
            break;
        case 2:
            await getReposts();
            await getReplies();
            break;
        default:
            console.error("mode参数错误");
            return;
    }
    var uids = Array.from(userMap.keys());
    var luckyUsers = [];
    console.log("中奖名单：");
    for(let i=0;i<number;i++){
        var uid = uids[Math.floor(Math.random()*uids.length)];
        luckyUsers.push([uid, userMap.get(uid)]);
    }
    console.table(luckyUsers);
}

