import { useState, useEffect } from 'react';          // React：フロントエンドJavaScriptライブラリ
import { FaStar, FaRegStar } from 'react-icons/fa';
import axios from "axios";                            // サーバ側へHTTPリクエストを送信するためのモジュール
import './App.css';                                   // CSSファイル(UIの装飾設定)の読み込み

const port = 3000;  // サーバのポート番号

// typeBookオブジェクト：検索結果等で表示する本情報の定義
interface typeBook {
  title: string;      // タイトル
  authors: string[];  // 著者
  thumbnail: string;  // 表紙画像
}

// 検索結果の初期値
// アプリケーション起動時に検索結果欄に表示されるもの
const initialBookList: typeBook[] = [
  {
    title: 'no result',                             // タイトルは'no result'の文字列
    authors: ['no results'],                        // 著者は'no result'の文字列
    thumbnail: 'https://via.placeholder.com/50x75'  // 表紙は50x75のグレー画像
  }
];

// Appコンポーネント：本検索アプリのクライアント側
function App() {
  // コンポーネント内で扱う状態値の定義
  // 書式：[状態値, 状態更新関数] = useState<状態の型>(初期値)
  const [keyword, setKeyword] = useState('');                             // 検索キーワード．初期値は''
  const [booklist, setBookList] = useState<typeBook[]>(initialBookList);  // 検索結果を格納するリスト．typeBook型．初期値はinitialBookList
  const [startindex, setStartIndex] = useState<number>(0);                // 検索開始位置．初期値は0

  const [favoritelist, setFavoriteList] = useState<typeBook[]>(() => {    // お気に入り登録情報を格納するリスト．typeBook型
    // ブラウザのキャッシュからお気に入り登録情報を取得
    // Appコンポーネントが読み込まれた際に実行される
    const storedFavorites = localStorage.getItem('favorites');
    return storedFavorites ? JSON.parse(storedFavorites): [];
  });

  const [error, setError] = useState<string | null>(null);                // エラーメッセージ

  // 本の検索を行うイベント
  // 入力された検索キーワードに関連する10個の本の情報をサーバから受け取る
  // 'Lookup'ボタン押下時に発火
  const handleLookupBook = async () => {
    console.log(keyword); // 検索キーワードをコンソールに出力
    try {
      await axios
        // GETメソッド
        // サーバの'/get_title'パスにアクセス
        .get(`http://localhost:${port}/get_title`, {
          params: {
            // GoogleBookAPIからの情報取得に必要なキー値をクエリとして送信
            keyword: keyword, // 検索キーワード
            startindex: 0     // 検索開始位置
          }
        })
        // レスポンスを受け取ったらthenを実行
        .then((res) => {
          setBookList(res.data.books);  // 検索結果をbooklistへ格納
          setStartIndex(10);            // 次の検索開始位置を10個後ろにずらす
          setError(null);               // エラーメッセージは無し
        })
    } catch (e) {
      // エラーコードを受け取った場合
      setBookList(initialBookList); // 検索結果を初期化
      setError('Lookup Error.');    // エラーメッセージは'Lookup Error.'
      console.log(error);           // コンソールにエラーメッセージを出力
    } 
  };

  // 検索結果をさらに追加で表示するイベント
  // 'Load More'ボタン押下時に発火
  // 'Load More'ボタンを押下する度に追加で10個の本の情報をサーバから受け取る
  const loadMore = async () => {
    try {
      await axios
        // GETメソッド
        // サーバの'/get_title'パスにアクセス
        .get(`http://localhost:${port}/get_title`, {
          params: {
            // GoogleBookAPIからの情報取得に必要なキー値をクエリとして送信
            keyword: keyword,       // 検索キーワード
            startindex: startindex  // 検索開始位置
          }
        })
        // レスポンスを受け取ったらthenを実行
        .then((res) => {
          console.log(res.data.books);                    // デバッグ用．追加情報を受け取れているかをコンソールで確認．
          setBookList([...booklist, ...res.data.books]);  // booklistへ新たに受け取った本情報を追加
          setStartIndex(startindex + 10);                 // 次の検索開始位置をさらに10個後ろにずらす
          setError(null);                                 // エラーメッセージは無し
        })
    } catch (e) {
      // エラーコードを受け取った場合
      setBookList(initialBookList); // 検索結果を初期化
      setError('LoadMore Error.');  // エラーメッセージは'LoadMore Error.'
      console.log(error);           // コンソールにエラーメッセージを出力
    }
  };

  // 新たにお気に入り登録した本の情報を追加
  const addToFavoriteList = (book: typeBook) => {
    setFavoriteList([...favoritelist, book]);
  };

  // お気に入り解除した本の情報を削除
  const removeFromFavoriteList = (book: typeBook) => {
    setFavoriteList(
      (prevfavoritelist) => prevfavoritelist.filter((fav) => fav.title !== book.title)
    );
  };

  // 引数bookがお気に入りに登録されているかを照合
  // お気に入り登録情報の中に含まれている場合，'true'を返す
  // 'true'の場合，bookの横の星型ボタンの表示を変更(☆ → ★)
  const isFavorite = (book: typeBook) => {
    return favoritelist.some((fav) => isSameBook(fav, book));
  };

  // 引数book1と引数book2の本情報が一致しているかを照合
  // 一致している場合，'true'を返す
  // isFavorite関数内で使用
  const isSameBook = (book1: typeBook, book2: typeBook) => {
    return (
      book1.title === book2.title &&
      book1.authors.length === book2.authors.length &&
      book1.authors.every((author, index) => author === book2.authors[index])
    );
  };

  // クライアントがサーバにアクセスできているかを確認
  // Appコンポーネントが読み込まれた際に1回だけ実行
  useEffect(() => {
    axios
      // GETメソッド
      // サーバのルートパスにアクセス
      .get(`http://localhost:${port}`)
      // レスポンスを受け取ったらthenを実行
      .then((response) => {
        // コンソールにレスポンスメッセージを出力
        console.log(response.data.message);
      })
      // エラーメッセージを受け取った場合
      .catch((e) => {
        // コンソールにエラーメッセージを出力
        console.log(e.message);
      });
  }, []);

  // お気に入り登録情報をブラウザのキャッシュに保存
  // favoritelist(お気に入り登録情報)が変化した際に実行
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favoritelist));
  }, [favoritelist]);

  // ブラウザに表示される画面(HTML)
  // 構成要素
  // ・テキストボックス：ユーザが検索キーワードを入力
  // ・'Lookup'ボタン：ユーザが検索キーワード入力の後に押下
  // ・'Results'：画面左に検索結果を表示
  // ・'Load More'ボタン：ユーザが検索結果をさらに表示する時に押下
  // ・'Favorites'：画面右にキャッシュから読み込んだお気に入り登録情報を表示
  // ・星型ボタン：ユーザが本をお気に入り登録する(お気に入り解除する)際に押下
  // ※星型ボタンの表示形式：お気に入り登録済 → ★(塗りつぶし)，未登録 → ☆(枠線のみ)
  return (
    <div>
      <h1>Book Lookup</h1>
      <input
        type = "text"
        value = {keyword}
        onChange = {(e) => setKeyword(e.target.value)}
        placeholder = 'Enter Keyword'
      />
      <button onClick={handleLookupBook}>Lookup</button>
      <div className='content'>
        <div className='results'>
        <h2>Results</h2>
          <ul className='book-list'>
            {booklist.map((book, index) => (
              <li key={index} className='book-item'>
                <img src={book.thumbnail} alt={book.title} className='book-image' />
                <div className='book-info'>
                  <h2>{book.title}</h2>
                  <p>著：{book.authors ? book.authors.join(', ') : 'Unknown Author'}</p>
                </div>
                <button 
                    onClick={() => isFavorite(book) ? removeFromFavoriteList(book) : addToFavoriteList(book)}
                    className='favorite-button'
                >
                  {isFavorite(book) ? <FaStar /> : <FaRegStar />}
                </button>
              </li>
            ))}
          </ul>
          {booklist.length > 0 && <button onClick={loadMore}>Load More</button>}
        </div>
        <div className='favorites'>
          <h2>Favorites</h2>
          <ul className='book-list'>
            {favoritelist.map((book, index) => (
              <li key={index} className='book-item'>
                <img src={book.thumbnail} alt={book.title} className='book-image' />
                <div className='book-info'>
                  <h2>{book.title}</h2>
                  <p>著：{book.authors ? book.authors.join(', ') : 'Unknown Author'}</p>
                </div>
                <button onClick={() => removeFromFavoriteList(book)} className='favorite-button'>
                  <FaStar />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;