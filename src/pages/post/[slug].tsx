import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { createElement, useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import Comments from '../../components/Comments';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';
import ptBR from 'date-fns/locale/pt-BR';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean;
  pagination: {
    nextPage: {
      title: string;
      href: string;
    };
    prevPage: {
      title: string;
      href: string;
    };
  };
}

export default function Post({ post, preview, pagination }: PostProps) {
  const router = useRouter();

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

          {post?.last_publication_date && (
            <span className={styles.updated}>
              * editado em
              {format(
                new Date(post?.last_publication_date),
                " dd MMM yyyy', às' HH:mm",
                { locale: ptBR }
              )}
            </span>
          )}

          {post.data.content.map(content => (
            <article key={content.heading}>
              <strong>{content.heading}</strong>
              <div
                className={styles.postContent}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          ))}
        </div>

        <div className={styles.containerAsidePreview}>
          {preview && (
            <aside className={styles.asidePreview}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </div>

        <div className={styles.postEnd}></div>

        {!preview && (
          <div className={styles.navigation}>
            {pagination.prevPage && (
              <div className={styles.divPrevPage}>
                <span>{pagination.prevPage.title}</span>
                <Link href={pagination.prevPage.href}>Post Anterior</Link>
              </div>
            )}

            {pagination.nextPage && (
              <div className={styles.divNextPage}>
                <span>{pagination.nextPage.title}</span>
                <Link href={pagination.nextPage.href}>Próximo post</Link>
              </div>
            )}
          </div>
        )}

        {!preview && <Comments />}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {}
  );

  const slugPosts = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths: [...slugPosts],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData = {},
  params,
}) => {
  const { slug } = params;
  const { ref } = previewData;

  const prismic = getPrismicClient();
  let response =
    preview && ref
      ? await prismic.getSingle('posts', { ref })
      : await prismic.getByUID('posts', String(slug), {});

  const {
    results: [prevPage],
  } = await prismic.query([Prismic.predicates.at('document.type', 'posts')], {
    after: response.id,
    orderings: '[document.first_publication_date desc]',
  });

  const {
    results: [nextPage],
  } = await prismic.query([Prismic.predicates.at('document.type', 'posts')], {
    after: response.id,
    orderings: '[document.first_publication_date]',
  });

  const pagination = {
    nextPage: nextPage
      ? {
          title: nextPage.data.title,
          href: `/post/${nextPage.uid}`,
        }
      : null,
    prevPage: prevPage
      ? {
          title: prevPage.data.title,
          href: `/post/${prevPage.uid}`,
        }
      : null,
  };

  response.first_publication_date = format(
    new Date(response.first_publication_date),
    'dd MMM yyyy'
  ).toLowerCase();

  return {
    props: {
      post: response,
      preview,
      pagination: nextPage || prevPage ? pagination : null,
    },
  };
};
