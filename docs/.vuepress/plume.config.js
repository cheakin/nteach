import {defineThemeConfig} from 'vuepress-theme-plume'
import {navbar} from './navbar'
import {notes} from './notes'

/**
 * @see https://theme-plume.vuejs.press/config/basic/
 */
export default defineThemeConfig({
  logo: '/avatar.jpg',
  // your git repo url
  docsRepo: '/nteach/',
  docsDir: 'docs',

  appearance: true,

  profile: {
    name: 'Jan',
    avatar: '/avatar.jpg',
    description: 'Less is more.',
    circle: true,
    // location: '',
    // organization: '',
  },
  social: [
    { icon: 'github', link: 'https://github.com/cheakin' },
  ],
  navbar,
  notes,

  plugins: {
    /**
     * Shiki 代码高亮
     * @see https://theme-plume.vuejs.press/config/plugins/code-highlight/
     */
    shiki: {
      // 强烈建议预设代码块高亮语言，插件默认加载所有语言会产生不必要的时间开销
      theme: { light: 'vitesse-light', dark: 'vitesse-dark' },
      languages: ['shell', 'bash', 'typescript', 'javascript', 'java', 'xml', 'yml', 'yaml'],
      collapseLines: true
    },
  }


})
