import Head from 'next/head';
import React from 'react';

export interface HeadInfoProps {
  title: string;
}
const HeadInfo = ({ title }: HeadInfoProps) => {
  return (
    <Head>
      <title>{title}</title>
    </Head>
  );
};

export default HeadInfo;
