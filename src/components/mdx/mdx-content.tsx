import * as runtime from "react/jsx-runtime";

type Components = Record<string, React.ComponentType<Record<string, unknown>>>;

// Velite compiles MDX at build time into a function body; this evaluates it with React's runtime.
const useMDXComponent = (code: string) => {
  const fn = new Function(code);
  return fn({ ...runtime }).default as React.ComponentType<{ components?: Components }>;
};

export function MDXContent({ code, components }: { code: string; components?: Components }) {
  const Component = useMDXComponent(code);
  return <Component components={components} />;
}
