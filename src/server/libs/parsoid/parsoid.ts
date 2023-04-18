import { Future, List } from '../../../shared/utils/fp'

/**
 * Parse wikitext (or html) to html (or wikitext).
 *
 * @param {Object} obj
 * @param {string} obj.input The string to parse
 * @param {string} obj.mode The mode to use
 * @param {Object} obj.parsoidOptions Will be Object.assign'ed to ParsoidConfig
 * @param {Object} obj.envOptions Will be Object.assign'ed to the env
 * @param {boolean} [obj.cacheConfig] Cache the constructed ParsoidConfig
 * @param {boolean} [obj.body_only] Only return the <body> children (T181657)
 * @param {Number} [obj.oldid]
 * @param {Object} [obj.selser]
 * @param {Object} [obj.pb]
 * @param {string} [obj.contentmodel]
 * @param {string} [obj.outputContentVersion]
 * @param {Object} [obj.reuseExpansions]
 * @param {string} [obj.pagelanguage]
 * @param {Object} [obj.variant]
 * @param {Function} [cb] Optional node-style callback
 *
 * @return {Promise}
 */

type Params = {
  input: string
  mode: 'wt2html'
  parsoidOptions: {
    linting: boolean
    loadWMF: boolean
    useWorker: boolean
    fetchConfig: boolean
    fetchTemplates: boolean
    fetchImageInfo: boolean
    expandExtensions: boolean
    rtTestMode: boolean
    addHTMLTemplateParameters: boolean
    usePHPPreProcessor: boolean
  }
  envOptions: {
    domain: string
    prefix: string
    pageName: string
    scrubWikitext: boolean
    pageBundle: boolean
    wrapSections: boolean
    logLevels: List<'fatal' | 'error' | 'warn'>
  }
  cacheConfig?: boolean
  body_only: boolean
  oldid: number | null
  selser?: object
  pb?: object
  contentmodel: string | null
  outputContentVersion: string
  reuseExpansions?: object
  pagelanguage?: string
  variant: object
}

const parse = (input: string): Future<unknown> => {
  var start = JSUtils.startTime()

  const obj: Params = {
    input,
    mode: 'wt2html',
    parsoidOptions: {
      linting: false,
      loadWMF: true, // true,
      useWorker: false,
      fetchConfig: true, // true,
      fetchTemplates: true, // true,
      fetchImageInfo: true, // true,
      expandExtensions: false, // true,
      rtTestMode: false,
      addHTMLTemplateParameters: false,
      usePHPPreProcessor: false, // true,
    },
    envOptions: {
      domain: 'leagueoflegends.fandom.com', // wiki
      prefix: 'fandomwiki',
      pageName: '',
      scrubWikitext: false,
      pageBundle: false,
      wrapSections: false,
      logLevels: ['fatal', 'error', 'warn'],
    },
    oldid: null,
    contentmodel: null,
    outputContentVersion: '2.1.0',
    body_only: true,
  }
}

module.exports = Promise.async(function* (obj) {
  // Enforce the contraints of passing to a worker
  obj = JSON.parse(JSON.stringify(obj))

  var hash = JSON.stringify(obj.parsoidOptions)
  var parsoidConfig
  if (obj.cacheConfig && configCache.has(hash)) {
    parsoidConfig = configCache.get(hash)
  } else {
    parsoidConfig = new ParsoidConfig(null, obj.parsoidOptions)
    if (obj.cacheConfig) {
      configCache.set(hash, parsoidConfig)
      // At present, we don't envision using the cache with multiple
      // configurations.  Prevent it from growing unbounded inadvertently.
      console.assert(configCache.size === 1, 'Config properties changed.')
    }
  }

  // const { input: {}, ...obj_ } = obj
  // console.log('obj =', { input: '...', ...obj_ })
  var env = yield ParserEnv.getParserEnv(parsoidConfig, obj.envOptions)
  env.startTime = start
  var s1 = JSUtils.startTime()
  env.bumpTimeUse('Setup Environment', s1 - start, 'Init')
  env.log('info', 'started ' + obj.mode)
  try {
    if (obj.oldid) {
      env.page.meta.revision.revid = obj.oldid
    }

    var out
    if (obj.mode === 'variant') {
      env.page.pagelanguage = obj.pagelanguage
      return _languageConversion(obj, env, obj.input)
    } else if (obj.mode === 'redlinks') {
      return _updateRedLinks(obj, env, obj.input)
    } else if (['html2wt', 'html2html', 'selser'].includes(obj.mode)) {
      // Selser
      var selser = obj.selser
      if (selser !== undefined) {
        if (selser.oldtext !== null) {
          env.setPageSrcInfo(selser.oldtext)
        }
        if (selser.oldhtml) {
          env.page.dom = env.createDocument(selser.oldhtml).body
        }
        if (selser.domdiff) {
          // FIXME: need to load diff markers from attributes
          env.page.domdiff = {
            isEmpty: false,
            dom: ContentUtils.ppToDOM(env, selser.domdiff),
          }
          throw new Error('this is broken')
        }
      }
      var html = obj.input
      env.bumpHtml2WtResourceUse('htmlSize', html.length)
      out = yield _fromHTML(obj, env, html, obj.pb)
      return obj.mode === 'html2html' ? _toHTML(obj, env, out.wt) : out
    } else {
      /* wt2html, wt2wt */
      // The content version to output
      if (obj.outputContentVersion) {
        env.setOutputContentVersion(obj.outputContentVersion)
      }

      if (obj.reuseExpansions) {
        env.cacheReusableExpansions(obj.reuseExpansions)
      }

      var wt = obj.input

      // Always fetch page info if we have an oldid
      if (obj.oldid || wt === undefined) {
        var target = env.normalizeAndResolvePageTitle()
        yield TemplateRequest.setPageSrcInfo(env, target, obj.oldid)
        env.bumpTimeUse('Pre-parse (source fetch)', JSUtils.elapsedTime(s1), 'Init')
        // Ensure that we don't env.page.reset() when calling
        // env.setPageSrcInfo(wt) in _toHTML()
        if (wt !== undefined) {
          env.topFrame.srcText = env.page.src = wt
          wt = undefined
        }
      }

      var wikitextSize = wt !== undefined ? wt.length : env.page.src.length
      env.bumpWt2HtmlResourceUse('wikitextSize', wikitextSize)
      if (parsoidConfig.metrics) {
        var mstr = obj.envOptions.pageWithOldid ? 'pageWithOldid' : 'wt'
        parsoidConfig.metrics.timing(`wt2html.${mstr}.size.input`, wikitextSize)
      }

      // Explicitly setting the pagelanguage can override the fetched one
      if (obj.pagelanguage) {
        env.page.pagelanguage = obj.pagelanguage
      }

      out = yield _toHTML(obj, env, wt)
      return obj.mode === 'wt2html' ? out : _fromHTML(obj, env, out.html)
    }
  } finally {
    var end = JSUtils.elapsedTime(start)
    yield env.log('info', `completed ${obj.mode} in ${end}ms`)
  }
}, 1)
