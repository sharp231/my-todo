// import React, { useState } from 'react';
import Head from 'next/head';
import TodoApp from '../../components/TodoApp';


const Home = () => {
  return (
    <div>
      <Head>
        <title>Todoアプリ</title>
        <meta name="description" content="Next.js Todoアプリ" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>Todoアプリ</h1>
      <TodoApp />
    </div>
  );
}
export default Home;