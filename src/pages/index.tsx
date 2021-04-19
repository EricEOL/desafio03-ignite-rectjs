import { useState } from 'react';

import { GetStaticProps } from 'next';
import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

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

export default function Home({ results, next_page }: PostPagination) {

  const [posts, setPosts] = useState<Post[]>(() => results);
  const [nextPage, setNextPage] = useState(() => String(next_page));

  function handleNextPage() {

    if(nextPage === null) return;

    fetch(nextPage)
      .then(response => response.json())
      .then(data => {

        setNextPage(data.next_page);

        data.results.map(post => {
          const postFormated = {
            slug: post.uid,
            first_publication_date: format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR }),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author
            }
          }
          setPosts([...posts, postFormated]);
        })
      });

  }


  return (
    <main className={commonStyles.container}>
      <img src="/Logo.svg" alt="logo" className={styles.logo} />

      <div className={styles.posts}>
        {posts.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <div>
                <time><FiCalendar />{post.first_publication_date}</time>
                <span><FiUser />{post.data.author}</span>
              </div>
            </a>
          </Link>
        ))}
        {nextPage !== null && <button onClick={handleNextPage}>Carregar mais posts</button>}
      </div>
    </main>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1,
  });

  const next_page = postsResponse.next_page;

  const posts = postsResponse.results.map(post => {
    return {
      slug: post.uid,
      first_publication_date: format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR }),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  return {
    props: {
      results: posts,
      next_page
    }
  }
};
