# monopoly-server

FatPaper 大富翁服务器

#### 运行

`yarn dev`

#### 目录结构

```
├─📁 public--------------------- # 静态资源，在没有用COS对象存储时上传的文件会存在这里
├─📁 src
│ ├─📁 classes
│ │ ├─📄 GameProcess.ts--------- # 游戏进程
│ │ ├─📄 GameSocketServer.ts---- # websocket服务器
│ │ └─📄 OperateListener.ts----- # 玩家行为监听工具（发布订阅模式）
│ ├─📁 db
│ │ ├─📁 api-------------------- # 数据库api
│ │ ├─📁 entities--------------- # 数据库实体
│ │ └─📄 dbConnecter.ts--------- # 数据库链接工具
│ ├─📁 enums-------------------- # 枚举
│ ├─📁 interfaces--------------- # 接口
│ ├─📁 routers------------------ # 路由
│ └─📁 utils
│   ├─📁 api
│   ├─📁 fetch
│   ├─📁 logger
│   ├─📄 file-uploader.ts------- # 文件上传工具
│   ├─📄 index.ts--------------- # 工具函数集
│   ├─📄 role-validation.ts----- # 身份验证中间件
│   └─📄 token.ts--------------- # token工具
├─📄 app.ts
└─📄 global.config.ts----------- # 配置数据桥梁
```