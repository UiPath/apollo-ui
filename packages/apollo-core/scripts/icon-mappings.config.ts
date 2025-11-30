/**
 * Icon name mapping configuration
 * Centralizes all special cases, folder mappings, and prefix handling
 */

export interface IconMappingConfig {
  folderPrefixMap: Record<string, string>;
  activityFolderMap: Record<string, string>;
  classicIconsMap: Record<string, string>;
  specialCases: Record<string, string>;
  commonPrefixes: string[];
}

export const iconMappingConfig: IconMappingConfig = {
  /**
   * Maps folder names to their preferred prefix
   */
  folderPrefixMap: {
    'check-box': 'checkbox',
    'data-type': 'type',
    'data-type-table': 'table',
    'data-rows': 'row',
    'error-indicator': 'error',
    'container-align': 'container-align',
    'container-stretch': 'container-stretch',
    'studio-web-icons-data-types': 'data-types',
  },

  /**
   * Maps activity folder names to simplified prefixes
   */
  activityFolderMap: {
    'office365-excel-activities': 'office365-excel',
    'microsoft-office365-apps': 'office365-apps',
    'oracle-netsuite-activities': 'oracle-netsuite',
    'slack-activities': 'slack',
    'vmware-activities': 'vmware',
  },

  /**
   * Maps classic-icons folder names to their prefixes
   */
  classicIconsMap: {
    'gsuite-apps': 'gsuite',
    'google-cloud-platform': 'google-cloud-platform',
    'configuration-panel': 'configuration-panel',
  },

  /**
   * Special case mappings for specific icon names
   */
  specialCases: {
    'close-clear-cancel-event-cancel-throwing-remove': 'close',
    'create-plus-event-parallel-build': 'create',
    'add-plus-event-parallel-build': 'add',
    'replay-reset-bpmn-event-loop': 'replay',
    'time-duration-to-be-used-instead-of-timer-bpmn-event-duration': 'duration',
    'remove-link-link-off-unlink': 'unlink',
    'play-slow-motion-play-animation': 'play-slow',
    'debug-report-a-bug': 'debug',
    'deployment-configuration-rocket': 'deploy',
    'assess-measure-evaluate': 'assess',
    'alert-error-fatal-log': 'alert-error-fatal',
    'exit-full-screen-minimize': 'minimize',
    'connection-off-cloud-off': 'cloud-off',
    'pinned-unpin': 'unpin',
    'unlock-lock-open': 'unlock',
    'add-comment-annotate': 'add-comment',
    'comment-left-annotated': 'comment',
    'map-move-transition': 'move',
    'get-step-into': 'step-into',
    'push-step-out': 'step-out',
    'skip-step-over': 'step-over',
    'run-play': 'play',
    'awaiting-pending': 'pending',
    'success-checkmark-check-circle': 'success-check',
    'security-verified-user': 'verified',
    'raise-alert': 'raise-alert',
    'retry-repeat-number-of-times-for-each-break-continue-iterate': 'retry',
    'http-api-request-http-client-activity': 'http-request',
    'placeholder-this-is-not-to-be-used-in-the-ui-only-for-wip': 'placeholder',
    'horizontal-center': 'horizontal-center',
    'vertical-center': 'vertical-center',
  },

  /**
   * Common prefixes to remove from icon names
   */
  commonPrefixes: [
    'icon-',
    'icon=',
    'package-',
    'package=',
    'category-',
    'category=',
    'property-1-',
    'property-',
    'activities-',
    'activities=',
    'activity-',
    'bpmn-',
    'classic-icons-',
    'classic-',
    'type=',
  ],
};
