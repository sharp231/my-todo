import Head from 'next/head';
// import { useState } from 'react';
// import LandingPage from '../../components/LandingPage';
import TodoApp from '../../components/TodoApp';


const Home = () => {
  return (
    <div>
      <Head>
        <title>TaskManager</title>
        <meta name="description" content="Next.js Todoアプリ" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <TodoApp />
    </div>
  );
}
export default Home;


// const Home = () => {
//   const [isStarted, setIsStarted] = useState(false);

//   return (
//     <div>
//       <Head>
//         <title>TaskManager</title>
//         <meta name="description" content="Next.js Todoアプリ" />
//         <link rel="icon" href="/favicon.svg" />
//       </Head>

//       {isStarted ? (
//         <TodoApp />
//       ) : (
//         <LandingPage onStart={() => setIsStarted(true)} />
//       )}
//     </div>
//   );
// };

// export default Home;

// const Home = () => null;

// export const getServerSideProps = () => ({
//   redirect: {
//     destination: '/app',
//     permanent: false,
//   },
// });

// export default Home;