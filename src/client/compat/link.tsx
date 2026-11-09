import React from 'react';
import { Link as WouterLink } from 'wouter';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export const Link: React.FC<LinkProps> = ({ href, children, ...props }) => {
  return (
    <WouterLink href={href} {...props}>
      {children}
    </WouterLink>
  );
};

export default Link;
