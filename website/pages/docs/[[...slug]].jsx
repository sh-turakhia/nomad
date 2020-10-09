import path from 'path'
import matter from 'gray-matter'
import Head from 'next/head'
import Link from 'next/link'
import highlight from '@mapbox/rehype-prism'
import hydrate from 'next-mdx-remote/hydrate'
import renderToString from 'next-mdx-remote/render-to-string'
import defaultMdxComponents from '@hashicorp/nextjs-scripts/lib/providers/docs'
import DocsPageComponent from '@hashicorp/react-docs-page'
import {
  anchorLinks,
  includeMarkdown,
  paragraphCustomAlerts,
  typography,
} from '@hashicorp/remark-plugins'
import { SearchProvider } from '@hashicorp/react-search'
import Placement from '../../components/placement-table'
import SearchBar from '../../components/search-bar'
import order from '../../data/docs-navigation'
import {
  getStaticMdxPaths,
  readAllFrontMatter,
  readContent,
} from '../../lib/server'

const GITHUB_CONTENT_REPO = 'hashicorp/nomad'
const MDX_COMPONENTS = defaultMdxComponents({
  product: 'nomad',
  additionalComponents: { Placement },
})

export default function DocsPage({
  renderedContent,
  frontMatter,
  resourceUrl,
  url,
  sidenavData,
}) {
  const hydratedContent = hydrate(renderedContent, {
    components: MDX_COMPONENTS,
  })
  return (
    <DocsPageComponent
      product="nomad"
      head={{
        is: Head,
        title: `${frontMatter.page_title} | Nomad by HashiCorp`,
        description: frontMatter.description,
        siteName: 'Nomad by HashiCorp',
      }}
      sidenav={{
        Link,
        category: 'docs',
        currentPage: url,
        data: sidenavData,
        order,
        disableFilter: true,
      }}
      resourceURL={resourceUrl}
    >
      <SearchProvider>
        <SearchBar />
        {hydratedContent}
      </SearchProvider>
    </DocsPageComponent>
  )
}

export async function getStaticProps({ params }) {
  const slug = ['docs', ...(params.slug || [])].join('/')
  const url = `/${slug}`
  const mdxPath = `content/${slug}.mdx`
  const indexMdxPath = `content/${slug}/index.mdx`

  const [mdxContent, indexMdxContent] = await Promise.all([
    readContent(`${process.cwd()}/${mdxPath}`),
    readContent(`${process.cwd()}/${indexMdxPath}`),
  ])
  const sidenavData = await readAllFrontMatter(`${process.cwd()}/content/docs`)

  const { content, data: frontMatter } = matter(mdxContent || indexMdxContent)
  const renderedContent = await renderToString(content, {
    components: MDX_COMPONENTS,
    mdxOptions: {
      remarkPlugins: [
        [
          includeMarkdown,
          { resolveFrom: path.join(process.cwd(), 'content/partials') },
        ],
        anchorLinks,
        paragraphCustomAlerts,
        typography,
      ],
      rehypePlugins: [[highlight, { ignoreMissing: true }]],
    },
  })

  return {
    props: {
      renderedContent,
      frontMatter,
      resourceUrl: `https://github.com/${GITHUB_CONTENT_REPO}/blob/master/website/${
        mdxContent ? mdxPath : indexMdxPath
      }`,
      url,
      sidenavData,
    },
  }
}

export async function getStaticPaths() {
  return {
    paths: await getStaticMdxPaths(`${process.cwd()}/content/docs`),
    fallback: false,
  }
}
