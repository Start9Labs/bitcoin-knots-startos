import { compat, matches, types as T } from "../dependencies.ts";

export const migration: T.ExpectedExports.migration =
  compat.migrations.fromMapping(
    {
      "27.1.0": {
        up: compat.migrations.updateConfig(
          (config: any) => config,
          false,
          { version: "27.1.0", type: "up" }
        ),
        down: compat.migrations.updateConfig(
          (config: any) => config,
          false,
          { version: "27.1.0", type: "down" }
        ),
      },
      "28.1.0.1": {
        up: compat.migrations.updateConfig(
          (config) => {
            if (
              !matches
                .shape({
                  advanced: matches.shape({
                    blocknotify: matches.any,
                  }),
                })
                .test(config)
            ) {
              throw new Error("Upgrading from Core to Knots is prohibited.");
            }
            return config;
          },
          true,
          {
            version: "28.1.0.1",
            type: "up",
          }
        ),
        down: compat.migrations.updateConfig((config: any) => config, true, {
          version: "28.1.0.1",
          type: "down",
        }),
      },
      "28.1.0.2": {
        up: compat.migrations.updateConfig(
          (config: any) => {
            config.coinstatsindex = false
            if (
              !matches
                .shape({
                  advanced: matches.shape({
                    blocknotify: matches.any,
                  }),
                })
                .test(config)
            ) {
              throw new Error("Upgrading from Core to Knots is prohibited.");
            } else {
              return config;
            }
          },
          true,
          {
            version: "28.1.0.2",
            type: "up",
          }
        ),
        down: compat.migrations.updateConfig((config: any) => config, true, {
          version: "28.1.0.2",
          type: "down",
        }),
      },
      "29.0": {
        up: compat.migrations.updateConfig(
          (config: any) => {
            config.coinstatsindex = false;
            config.blkconstr.mempoolreplacement = {mode: "optout",};
            config.softwareexpiry = 1825593420;
            if (
              !matches
                .shape({
                  advanced: matches.shape({
                    blocknotify: matches.any,
                  }),
                })
                .test(config)
            ) {
              throw new Error("Upgrading from Core to Knots is prohibited.");
            } else {
              return config;
            }
          },
          true,
          {
            version: "29.0",
            type: "up",
          }
        ),
        down: compat.migrations.updateConfig((config: any) => {
          delete config.softwareexpiry;

          return config;
        },
        true,
        {
          version: "29.0",
          type: "down",
        }),
      }
    },
    "29.0.0"
  );