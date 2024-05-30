import React from 'react';

import { cn } from '@/lib/utils';

export const TypographyH1 = ({
  className,
  children,
  ...rest
}: React.HTMLProps<HTMLHeadingElement>) => {
  return (
    <h1
      className={cn(
        `scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl`,
        className
      )}
      {...rest}
    >
      {children}
    </h1>
  );
};

export const TypographyH2 = ({
  className,
  children,
  ...rest
}: React.HTMLProps<HTMLHeadingElement>) => {
  return (
    <h2
      className={cn(
        `scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0`,
        className
      )}
      {...rest}
    >
      {children}
    </h2>
  );
};

export const TypographyH3 = ({
  className,
  children,
  ...rest
}: React.HTMLProps<HTMLHeadingElement>) => {
  return (
    <h2
      className={cn(
        `scroll-m-20 text-2xl font-semibold tracking-tight`,
        className
      )}
      {...rest}
    >
      {children}
    </h2>
  );
};

export const TypographyH4 = ({
  className,
  children,
  ...rest
}: React.HTMLProps<HTMLHeadingElement>) => {
  return (
    <h2
      className={cn(
        `scroll-m-20 text-xl font-semibold tracking-tight`,
        className
      )}
      {...rest}
    >
      {children}
    </h2>
  );
};

export const TypographyParagraph = ({
  className,
  children,
  ...rest
}: React.HTMLProps<HTMLParagraphElement>) => {
  return (
    <p
      className={cn(`leading-7 [&:not(:first-child)]:mt-6`, className)}
      {...rest}
    >
      {children}
    </p>
  );
};

export const TypographyAnchor = ({
  className,
  children,
  ...rest
}: React.HTMLProps<HTMLAnchorElement>) => {
  return (
    <a
      className={cn(
        `font-medium text-primary underline underline-offset-4`,
        className
      )}
      {...rest}
    >
      {children}
    </a>
  );
};

export const TypographyBlockquote = ({
  className,
  children,
  ...rest
}: React.HTMLProps<HTMLQuoteElement>) => {
  return (
    <blockquote
      className={cn(`mt-6 border-l-2 pl-6 italic`, className)}
      {...rest}
    >
      {children}
    </blockquote>
  );
};

export const TypographyUlist = ({
  className,
  children,
  ...rest
}: React.HTMLProps<HTMLUListElement>) => {
  return (
    <ul className={cn(`my-6 ml-6 list-disc [&>li]:mt-2`, className)} {...rest}>
      {children}
    </ul>
  );
};

export const TypographyLead = ({
  children,
  className,
  ...rest
}: React.HTMLProps<HTMLParagraphElement>) => {
  return (
    <p className={cn(`text-xl text-muted-foreground`, className)} {...rest}>
      {children}
    </p>
  );
};

export const TypographyLarge = ({
  children,
  className,
  ...rest
}: React.HTMLProps<HTMLDivElement>) => {
  return (
    <div className={cn(`text-lg font-semibold`, className)} {...rest}>
      {children}
    </div>
  );
};

export const TypographySmall = ({
  children,
  className,
  ...rest
}: React.HTMLProps<HTMLElement>) => {
  return (
    <small
      className={cn(`text-sm font-medium leading-none`, className)}
      {...rest}
    >
      {children}
    </small>
  );
};

export const TypographyMuted = ({
  children,
  className,
  ...rest
}: React.HTMLProps<HTMLParagraphElement>) => {
  return (
    <p className={cn(`text-sm text-muted-foreground`, className)} {...rest}>
      {children}
    </p>
  );
};
