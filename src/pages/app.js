import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import Head from 'next/head';

import TodoApp from '../../components/TodoApp';

const AppPage = () => {
  return (
    <>
      <Head>
        <title>TaskManager</title>
        <meta
          name="description"
          content="ログインユーザー用Todoアプリ"
        />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <Show when="signed-out">
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <section className="text-center">
            <h1 className="text-3xl font-bold mb-4">
              TaskManager
            </h1>

            <p className="text-gray-600 mb-6">
              TaskManagerを利用するにはログインしてください。
            </p>

            <div className="flex justify-center gap-4">
              <SignInButton>
                <button
                  type="button"
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white"
                >
                  ログイン
                </button>
              </SignInButton>

              <SignUpButton>
                <button
                  type="button"
                  className="px-6 py-3 rounded-lg border border-blue-600 text-blue-600"
                >
                  アカウント作成
                </button>
              </SignUpButton>
            </div>
          </section>
        </main>
      </Show>

      <Show when="signed-in">
        <header className="flex justify-end p-4">
          <UserButton />
        </header>

        <TodoApp />
      </Show>
    </>
  );
};

export default AppPage;