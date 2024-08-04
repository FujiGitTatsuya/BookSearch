import { Application, Request, Response } from "express";   // Node.jsのサーバサイドのフレームワーク
import * as express from "express";                         // Node.jsのサーバサイドのフレームワーク
import * as cors from "cors";                               // クロスオリジンリソース共有
import axios from "axios";                                  // HTTP通信ライブラリ
//import { port } from "../types";

const app: Application = express();
const port = 3000; // サーバのポート番号

app.use(cors({ origin: "http://localhost:5173" })); // フロントエンドのリソースを読み込むためのオリジンリソース共有
app.use(express.json());                            
app.use(express.urlencoded({ extended: true }));

// typeBookオブジェクト：検索結果として取得する本情報の定義
interface typeBook {
    title: string;      // タイトル
    authors: string[];  // 著者
    thumbnail: string;  // 表紙画像
}

// ルートパスに送信されたGETリクエストに関する処理
app.get('/', (req: Request, res: Response) => {
    console.log("accept GET request.");             // コンソールに"accept GET request."を出力
    return res.status(200).json({ message: "OK" }); // ステータス200で"OK"メッセージを返す
});

// '/get_title'パスに送信されたGETリクエストに関する処理
app.get('/get_title', async (req: Request, res: Response) => {
    console.log("accept BOOK-INFO GET request.");   // コンソールに"accept BOOK-INFO GET request."を出力
    const { keyword, startindex } = req.query;      // リクエストのクエリに含まれるキー値を取得
    console.log(keyword);                           // コンソールにキー値を出力
    console.log(startindex);                        // コンソールにキー値を出力

    const state_url = "https://www.googleapis.com/books/v1/volumes?q="  // Google Books APIsのメインURL
    try {
        const response = await axios
            // Google Books APIsにクエリを送信
            // キー値としてキーワード(keyword)と検索開始位置(startindex)を送信
            .get(`${state_url}${keyword}&maxResults=10&startIndex=${startindex}`);
        
        if (response.data.items) {
            // レスポンスがあった場合
            // Google Books APIsから10件の本情報が返ってくる
            const books: typeBook[] = response.data.items.map((item: any) => ({
                // 各本のタイトル・著者・表紙画像をtypeBook型に変換
                // 10件のtypebook型の本情報のリストがbooksに格納される
                title: item.volumeInfo.title,                           // レスポンスから本のタイトルを抽出
                authors: item.volumeInfo.authors || ['Unknown Author'], // 著者情報を抽出．無ければ'Unknown Author'とする
                thumbnail: item.volumeInfo.imageLinks?.thumbnail || ''  // 表紙画像のURLを抽出．無ければ空文字とする
            }));
            // ステータス200でbooksをjsonに変換して返す
            res.status(200).json({ books });
        } else {
            // レスポンスが無かった場合
            // ステータス404で'Title not found'メッセージを返す
            res.status(404).json({ message: 'Title not found' });
        }
    } catch (e) {
        // エラーをキャッチした場合
        // ステータス500で'Server error'メッセージとエラー内容を返す
        res.status(500).json({ message: 'Server error', e });
    }
});

try {
    // 正常にサーバが起動された場合
    // 指定したポート番号でサーバを待機
    app.listen(port, () => {
        // コンソールにサーバが待機している場所を出力
        console.log(`server running at: http://localhost:${port}`);
    });
} catch (e) {
    // サーバ起動時にエラーが出た場合
    if (e instanceof Error) {
        // コンソールにエラーメッセージ出力
        console.error(e.message);
    }
}