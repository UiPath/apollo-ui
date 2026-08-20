import { describe, expect, it } from 'vitest';

// Test the toPascalCase function used in icon name generation
function toPascalCase(str: string): string {
  const knownWords: Record<string, string> = {
    'api': 'API',
    'ui': 'UI',
    'url': 'URL',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'onedrive': 'OneDrive',
    'sharepoint': 'SharePoint',
    'powerpoint': 'PowerPoint',
    'onenote': 'OneNote',
    'uipath': 'UiPath',
    'sap': 'SAP',
    'crm': 'CRM',
    'pdf': 'PDF',
    'json': 'JSON',
    'xml': 'XML',
    'html': 'HTML',
    'css': 'CSS',
    'sql': 'SQL',
    'ftp': 'FTP',
    'smtp': 'SMTP',
    'imap': 'IMAP',
    'pop3': 'POP3',
    'http': 'HTTP',
    'https': 'HTTPS',
    'oauth': 'OAuth',
    'openai': 'OpenAI',
    'aws': 'AWS',
    'gcp': 'GCP',
    'azure': 'Azure',
    'iot': 'IoT',
    'ml': 'ML',
    'ai': 'AI',
    'sso': 'SSO',
    'mfa': 'MFA',
    'cdn': 'CDN',
    'sdk': 'SDK',
    'ide': 'IDE',
  };

  return str
    .split(/[-\s]+/)
    .map((word) => {
      const lowerWord = word.toLowerCase();
      if (knownWords[lowerWord]) {
        return knownWords[lowerWord];
      }
      // Preserve existing casing instead of forcing lowercase
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

describe('Icon Name Generation', () => {
  describe('PascalCase Conversion', () => {
    it('should convert kebab-case to PascalCase', () => {
      expect(toPascalCase('my-icon-name')).toBe('MyIconName');
    });

    it('should convert space-separated to PascalCase', () => {
      expect(toPascalCase('my icon name')).toBe('MyIconName');
    });

    it('should handle single word', () => {
      expect(toPascalCase('icon')).toBe('Icon');
    });

    it('should handle already PascalCase', () => {
      expect(toPascalCase('MyIcon')).toBe('MyIcon');
    });
  });

  describe('Acronym Preservation', () => {
    it('should preserve API acronym', () => {
      expect(toPascalCase('api-key')).toBe('APIKey');
      expect(toPascalCase('rest-api')).toBe('RestAPI');
    });

    it('should preserve UI acronym', () => {
      expect(toPascalCase('ui-component')).toBe('UIComponent');
    });

    it('should preserve URL acronym', () => {
      expect(toPascalCase('extract-url')).toBe('ExtractURL');
    });

    it('should preserve HTTP/HTTPS', () => {
      expect(toPascalCase('http-request')).toBe('HTTPRequest');
      expect(toPascalCase('https-client')).toBe('HTTPSClient');
    });

    it('should preserve file format acronyms', () => {
      expect(toPascalCase('json-file')).toBe('JSONFile');
      expect(toPascalCase('xml-parser')).toBe('XMLParser');
      expect(toPascalCase('pdf-document')).toBe('PDFDocument');
    });

    it('should preserve email protocol acronyms', () => {
      expect(toPascalCase('smtp-server')).toBe('SMTPServer');
      expect(toPascalCase('imap-client')).toBe('IMAPClient');
      expect(toPascalCase('pop3-mail')).toBe('POP3Mail');
    });
  });

  describe('Brand Name Preservation', () => {
    it('should preserve GitHub', () => {
      expect(toPascalCase('github-repo')).toBe('GitHubRepo');
    });

    it('should preserve GitLab', () => {
      expect(toPascalCase('gitlab-project')).toBe('GitLabProject');
    });

    it('should preserve Microsoft product names', () => {
      expect(toPascalCase('onedrive-file')).toBe('OneDriveFile');
      expect(toPascalCase('sharepoint-site')).toBe('SharePointSite');
      expect(toPascalCase('powerpoint-slide')).toBe('PowerPointSlide');
      expect(toPascalCase('onenote-page')).toBe('OneNotePage');
    });

    it('should preserve UiPath', () => {
      expect(toPascalCase('uipath-robot')).toBe('UiPathRobot');
    });

    it('should preserve OpenAI', () => {
      expect(toPascalCase('openai-model')).toBe('OpenAIModel');
    });
  });

  describe('Tech Stack Acronyms', () => {
    it('should preserve SAP', () => {
      expect(toPascalCase('sap-system')).toBe('SAPSystem');
    });

    it('should preserve CRM', () => {
      expect(toPascalCase('crm-contact')).toBe('CRMContact');
    });

    it('should preserve OAuth', () => {
      expect(toPascalCase('oauth-token')).toBe('OAuthToken');
    });

    it('should preserve cloud provider acronyms', () => {
      expect(toPascalCase('aws-lambda')).toBe('AWSLambda');
      expect(toPascalCase('gcp-storage')).toBe('GCPStorage');
      expect(toPascalCase('azure-function')).toBe('AzureFunction');
    });

    it('should preserve AI/ML acronyms', () => {
      expect(toPascalCase('ai-model')).toBe('AIModel');
      expect(toPascalCase('ml-training')).toBe('MLTraining');
    });
  });

  describe('Security Acronyms', () => {
    it('should preserve SSO', () => {
      expect(toPascalCase('sso-login')).toBe('SSOLogin');
    });

    it('should preserve MFA', () => {
      expect(toPascalCase('mfa-auth')).toBe('MFAAuth');
    });
  });

  describe('Mixed Case Scenarios', () => {
    it('should handle multiple acronyms', () => {
      expect(toPascalCase('api-json-xml')).toBe('APIJSONXML');
    });

    it('should handle acronyms with regular words', () => {
      expect(toPascalCase('get-api-token')).toBe('GetAPIToken');
      expect(toPascalCase('upload-pdf-file')).toBe('UploadPDFFile');
    });

    it('should handle complex icon names', () => {
      expect(toPascalCase('ui-automation-for-each-ui-element')).toBe('UIAutomationForEachUIElement');
      expect(toPascalCase('agent-trace-api-workflow-run')).toBe('AgentTraceAPIWorkflowRun');
      expect(toPascalCase('microsoft-dynamics-crm')).toBe('MicrosoftDynamicsCRM');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(toPascalCase('')).toBe('');
    });

    it('should handle single character', () => {
      expect(toPascalCase('a')).toBe('A');
    });

    it('should handle numbers', () => {
      expect(toPascalCase('icon-123')).toBe('Icon123');
    });

    it('should handle leading/trailing spaces', () => {
      expect(toPascalCase('  my-icon  ')).toBe('MyIcon');
    });

    it('should handle multiple consecutive separators', () => {
      expect(toPascalCase('my---icon')).toBe('MyIcon');
      expect(toPascalCase('my   icon')).toBe('MyIcon');
    });
  });

  describe('Real Icon Names from Project', () => {
    // These are actual icon names that had casing issues
    it('should handle ActivityIMAP correctly', () => {
      expect(toPascalCase('activity-imap')).toBe('ActivityIMAP');
    });

    it('should handle ActivityPOP3 correctly', () => {
      expect(toPascalCase('activity-pop3')).toBe('ActivityPOP3');
    });

    it('should handle ActivitySMTP correctly', () => {
      expect(toPascalCase('activity-smtp')).toBe('ActivitySMTP');
    });

    it('should handle AdobePDF correctly', () => {
      expect(toPascalCase('adobe-pdf')).toBe('AdobePDF');
    });

    it('should handle CheckState correctly', () => {
      expect(toPascalCase('check-state')).toBe('CheckState');
    });

    it('should handle ForEachUIElement correctly', () => {
      expect(toPascalCase('for-each-ui-element')).toBe('ForEachUIElement');
    });

    it('should handle GenAI correctly', () => {
      expect(toPascalCase('gen-ai')).toBe('GenAI');
    });

    it('should handle GitHub correctly', () => {
      expect(toPascalCase('github')).toBe('GitHub');
    });

    it('should handle GoToURL correctly', () => {
      expect(toPascalCase('go-to-url')).toBe('GoToURL');
    });

    it('should handle HTTPRequest correctly', () => {
      expect(toPascalCase('http-request')).toBe('HTTPRequest');
    });

    it('should handle MicrosoftOneDrive correctly', () => {
      expect(toPascalCase('microsoft-onedrive')).toBe('MicrosoftOneDrive');
    });

    it('should handle OpenAI correctly', () => {
      expect(toPascalCase('openai')).toBe('OpenAI');
    });

    it('should handle SAPCloudForCustomer correctly', () => {
      expect(toPascalCase('sap-cloud-for-customer')).toBe('SAPCloudForCustomer');
    });

    it('should handle UiPath correctly', () => {
      expect(toPascalCase('uipath')).toBe('UiPath');
    });

    it('should handle UIAutomationGetURL correctly', () => {
      expect(toPascalCase('ui-automation-get-url')).toBe('UIAutomationGetURL');
    });
  });
});

describe('Icon Name Uniqueness', () => {
  it('should detect duplicate icon names', () => {
    const iconNames = new Set<string>();
    const duplicates: string[] = [];

    const names = ['Icon1', 'Icon2', 'Icon1', 'Icon3'];

    names.forEach((name) => {
      if (iconNames.has(name)) {
        duplicates.push(name);
      } else {
        iconNames.add(name);
      }
    });

    expect(duplicates).toEqual(['Icon1']);
  });

  it('should validate all icon names are unique', () => {
    // This test would be run against actual generated icons
    const mockIconNames = [
      'GitHub',
      'GitLab',
      'APIKey',
      'UIComponent',
      'HTTPRequest',
    ];

    const uniqueNames = new Set(mockIconNames);
    expect(uniqueNames.size).toBe(mockIconNames.length);
  });
});

describe('SVG to React Transformation', () => {
  function transformSvgToReact(svgContent: string): string {
    let content = svgContent
      .replace(/\s*xmlns:xlink="[^"]*"/g, '');

    // First pass: Handle namespace attributes (e.g., xlink:href -> xlinkHref)
    content = content.replace(/\s(\w+):(\w+)=/g, (_match, namespace, attr) => {
      return ` ${namespace}${attr.charAt(0).toUpperCase()}${attr.slice(1)}=`;
    });

    // Second pass: Convert kebab-case attributes to camelCase
    content = content.replace(/\s([\w]+-[\w-]+)=/g, (_match, attrName) => {
      const camelCase = attrName.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
      return ` ${camelCase}=`;
    });

    return content;
  }

  describe('Namespace Attribute Conversion', () => {
    it('should convert xlink:href to xlinkHref', () => {
      const svg = '<use xlink:href="#icon"/>';
      const result = transformSvgToReact(svg);
      expect(result).toContain('xlinkHref');
      expect(result).not.toContain('xlink:href');
    });

    it('should remove xmlns:xlink declaration', () => {
      const svg = '<svg xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="#icon"/></svg>';
      const result = transformSvgToReact(svg);
      expect(result).not.toContain('xmlns:xlink');
      expect(result).toContain('xlinkHref');
    });
  });

  describe('Kebab-Case to CamelCase', () => {
    it('should convert stop-color to stopColor', () => {
      const svg = '<stop stop-color="#fff"/>';
      const result = transformSvgToReact(svg);
      expect(result).toContain('stopColor');
      expect(result).not.toContain('stop-color');
    });

    it('should convert stroke-width to strokeWidth', () => {
      const svg = '<rect stroke-width="2"/>';
      const result = transformSvgToReact(svg);
      expect(result).toContain('strokeWidth');
      expect(result).not.toContain('stroke-width');
    });

    it('should convert fill-opacity to fillOpacity', () => {
      const svg = '<circle fill-opacity="0.5"/>';
      const result = transformSvgToReact(svg);
      expect(result).toContain('fillOpacity');
      expect(result).not.toContain('fill-opacity');
    });

    it('should handle multiple kebab-case attributes', () => {
      const svg = '<rect stroke-width="2" fill-opacity="0.5" stroke-linecap="round"/>';
      const result = transformSvgToReact(svg);
      expect(result).toContain('strokeWidth');
      expect(result).toContain('fillOpacity');
      expect(result).toContain('strokeLinecap');
    });
  });

  describe('Preserve Valid Attributes', () => {
    it('should preserve already camelCase attributes', () => {
      const svg = '<circle cx="10" cy="10" r="5"/>';
      const result = transformSvgToReact(svg);
      expect(result).toBe(svg);
    });

    it('should preserve single-word attributes', () => {
      const svg = '<rect width="100" height="50" fill="red"/>';
      const result = transformSvgToReact(svg);
      expect(result).toBe(svg);
    });
  });
});
