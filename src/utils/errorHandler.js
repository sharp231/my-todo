export const handleError = (res, error, message = 'Internal Server Error') => {
    console.error(message, error); // エラーをログに記録
    res.status(500).json({ error: message }); // クライアントにエラーメッセージを返す
  };