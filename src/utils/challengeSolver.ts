import axios from 'axios';
import * as vm from 'vm';

/**
 * Fetches HTML from the specified URL, solving the Sucuri JS challenge if present.
 * Uses a sandboxed VM to evaluate the Javascript payload and retrieve the cookie.
 */
export async function fetchHtmlWithChallenge(url: string): Promise<string> {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  };

  const response = await axios.get(url, {
    headers,
    validateStatus: () => true,
  });

  const html = response.data;
  if (typeof html === 'string' && html.includes('sucuri_cloudproxy_js')) {
    const sMatch = html.match(/S\s*=\s*'([^']+)'/);
    if (!sMatch) {
      throw new Error('Sucuri JS challenge detected, but S variable was not found in response.');
    }
    const S = sMatch[1];
    const decodedScript = Buffer.from(S, 'base64').toString('utf-8');

    // Prepare sandbox environment for executing the decoded Sucuri challenge code
    const sandbox = {
      document: { cookie: '' },
      location: { reload: () => {} },
      String: String,
    };

    vm.createContext(sandbox);
    vm.runInContext(decodedScript, sandbox);

    const cookie = sandbox.document.cookie;
    if (!cookie) {
      throw new Error('Sucuri JS challenge evaluated, but no cookie was generated.');
    }

    const cookieParts = cookie.split(';')[0];

    // Retry request with the solved cookie
    const responseWithCookie = await axios.get(url, {
      headers: {
        ...headers,
        Cookie: cookieParts,
      },
      validateStatus: () => true,
    });

    if (responseWithCookie.status !== 200) {
      throw new Error(
        `Failed to fetch site after solving Sucuri JS challenge. Status code: ${responseWithCookie.status}`,
      );
    }

    const htmlWithCookie = responseWithCookie.data;
    if (typeof htmlWithCookie === 'string' && htmlWithCookie.includes('sucuri_cloudproxy_js')) {
      throw new Error('Sucuri JS challenge still detected after sending the solved cookie.');
    }

    return htmlWithCookie;
  }

  if (response.status !== 200) {
    throw new Error(`Failed to fetch page. Status code: ${response.status}`);
  }

  return html;
}
