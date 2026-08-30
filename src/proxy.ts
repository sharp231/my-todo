import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // Todo画面でClerkの認証状態を利用可能にする
    '/app/:path*',

    // Todo APIへClerkの認証情報を接続する
    '/api/todos/:path*',

    // Clerk Frontend API proxy用の予約パス
    '/__clerk/:path*',
  ],
};