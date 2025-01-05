interface BrowserVersions {
    [key: string]: string[];
  }
  
  interface OsVersions {
    [key: string]: string[];
  }
  
  interface Headers {
    [key: string]: string;
  }
  
  export class UserAgentGenerator {
    private browsers: BrowserVersions;
    private osVersions: OsVersions;
  
    constructor() {
      this.browsers = {
        chrome: [
          '108.0.0.0',
          '107.0.0.0',
          '106.0.0.0',
        ],
        firefox: [
          '107.0',
          '106.0',
          '105.0',
        ],
        safari: [
          '16.0',
          '15.6',
          '15.5',
        ]
      };
  
      this.osVersions = {
        windows: ['10.0', '11.0'],
        macos: ['12_0', '11_6', '10_15'],
        linux: ['x86_64', 'i686']
      };
    }
  
    private getOsString(osName: string, osVersion: string): string {
      switch (osName) {
        case 'windows':
          return `Windows NT ${osVersion}`;
        case 'macos':
          return `Macintosh; Intel Mac OS X ${osVersion}`;
        default:
          return `X11; Linux ${osVersion}`;
      }
    }
  
    private getChromeUA(osName: string, osVersion: string, browserVersion: string): string {
      return `Mozilla/5.0 (${this.getOsString(osName, osVersion)}) ` +
             `AppleWebKit/537.36 (KHTML, like Gecko) ` +
             `Chrome/${browserVersion} Safari/537.36`;
    }
  
    private getFirefoxUA(osName: string, osVersion: string, browserVersion: string): string {
      return `Mozilla/5.0 (${this.getOsString(osName, osVersion)}; rv:${browserVersion}) ` +
             `Gecko/20100101 Firefox/${browserVersion}`;
    }
  
    private getSafariUA(osVersion: string, browserVersion: string): string {
      return `Mozilla/5.0 (Macintosh; Intel Mac OS X ${osVersion}) ` +
             `AppleWebKit/605.1.15 (KHTML, like Gecko) ` +
             `Version/${browserVersion} Safari/605.1.15`;
    }
  
    private getRandomElement<T>(array: T[]): T {
      return array[Math.floor(Math.random() * array.length)];
    }
  
    generate(browser?: string, osName?: string): string {
      // Select random browser if not specified
      const selectedBrowser = browser || this.getRandomElement(Object.keys(this.browsers));
      
      // Select valid OS based on browser
      const validOs = selectedBrowser === 'safari' 
        ? ['windows', 'macos']
        : ['windows', 'macos', 'linux'];
      const selectedOs = osName || this.getRandomElement(validOs);
  
      const browserVersion = this.getRandomElement(this.browsers[selectedBrowser]);
      const osVersion = this.getRandomElement(this.osVersions[selectedOs]);
  
      switch (selectedBrowser) {
        case 'chrome':
          return this.getChromeUA(selectedOs, osVersion, browserVersion);
        case 'firefox':
          return this.getFirefoxUA(selectedOs, osVersion, browserVersion);
        default:
          return this.getSafariUA(osVersion, browserVersion);
      }
    }
  
    getHeaders(): Headers {
      return {
        'User-Agent': this.generate(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      };
    }
  }