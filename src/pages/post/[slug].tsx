import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import { RichText } from "prismic-dom";
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/router'

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
  totalWords: number;
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  // const [totalWords, setTotalWords] = useState(0);

  // useEffect(() => {
  //    let totalWords = 0;
  //  totalWords += post.data.title.length;

  //   const totalContentWord = post.data.content.reduce((acc, content) => {
  //     return acc + content.heading.length + RichText.asText(content.body).length;
  //   }, 0);

  //   totalWords += totalContentWord;
  //   setTotalWords(totalWords);
  // }, [post]);

  if (router.isFallback) {
    return (
      <div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <header className={styles.header}>
        <img src={post.data.banner.url} alt="logo" />
      </header>

      <main className={styles.container}>
        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.about}>
            <div>
              <FiCalendar /> <span>{post.first_publication_date}</span>
            </div>
            <div>
              <FiUser /> <span>{post.data.author}</span>
            </div>
            <div>
              <FiClock /> <span>4 min</span>
            </div>
          </div>

          {post.data.content.map(content => (
            <article key={content.heading}>
              <strong>{content.heading}</strong>
              <div
                className={styles.postContent}
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }}
              />
            </article>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
  });

  const slugPosts = posts.results.map(post => {
    return {
      params: { slug: post.uid }
    }
  })

  return {
    paths: [...slugPosts],
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  response.first_publication_date = format(
    new Date(response.first_publication_date),
    'dd MMM yyyy'
  ).toLowerCase()

  return {
    props: {
      post: response
    }
  }
};
