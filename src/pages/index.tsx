import { GetStaticProps } from 'next';
import Head from 'next/head'

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { FiCalendar, FiUser } from 'react-icons/fi'
import { RichText } from 'prismic-dom';
import { useCallback, useState } from 'react';
import { format } from 'date-fns';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {

  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [posts, setPosts] = useState<Post[]>(postsPagination.results)

  const handleMorePosts = useCallback(() => {
    fetch(nextPage)
      .then(data => data.json())
      .then(response => {
        setNextPage(response.next_page);
        setPosts([...posts, ...response.results]);
      })
      .catch(error => console.log(error))
  }, [nextPage]);

  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>

      <main className={styles.container} >
        <img src="/images/Logo.svg" alt="logo" style={{ display: 'none' }} />
        <div className={styles.content} >
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <time>
                    <FiCalendar /> {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy'
                    ).toLowerCase()}
                  </time>
                  <span>
                    <FiUser /> {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}


          {nextPage &&
            <button onClick={handleMorePosts}>
              Carregar mais posts
            </button>
          }
        </div>

      </main>
    </>
  )
}

export const getStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1
  });

  const next_page = postsResponse.next_page;

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  return {
    props: {
      postsPagination: {
        ...postsResponse,
        results
      }
    }
  }
};
