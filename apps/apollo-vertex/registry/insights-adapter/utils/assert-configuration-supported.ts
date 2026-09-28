interface ConfigurationWithJoinsAndFrom {
  id: string;
  joins?: ReadonlyArray<unknown>;
  from?: unknown;
}

export function assertInsightsConfigurationSupported(
  configuration: ConfigurationWithJoinsAndFrom,
): void {
  if (configuration.joins && configuration.joins.length > 0) {
    throw new Error(
      `Insights does not support joins (chart configuration "${configuration.id}").`,
    );
  }
  if (configuration.from) {
    throw new Error(
      `Insights does not support "from" (chart configuration "${configuration.id}").`,
    );
  }
}
