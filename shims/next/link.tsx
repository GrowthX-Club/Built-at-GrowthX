import React from "react";
import { Link as RouterLink } from "react-router";

function Link({ href, children, className, style, target, rel, onClick, ...rest }: any) {
  const resolvedHref = typeof href === "object"
    ? href.pathname + (href.query ? "?" + new URLSearchParams(href.query).toString() : "")
    : href;

  if (resolvedHref?.startsWith("http") || resolvedHref?.startsWith("//")) {
    return <a href={resolvedHref} className={className} style={style} target={target} rel={rel} onClick={onClick} {...rest}>{children}</a>;
  }

  return <RouterLink to={resolvedHref} className={className} style={style} target={target} rel={rel} onClick={onClick} {...rest}>{children}</RouterLink>;
}

export default Link;
