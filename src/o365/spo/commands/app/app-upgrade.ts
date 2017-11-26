import { ODataError, ContextInfo } from './../../spo';
import auth from '../../SpoAuth';
import Auth from '../../../../Auth';
import config from '../../../../config';
import commands from '../../commands';
import VerboseOption from '../../../../VerboseOption';
import * as request from 'request-promise-native';
import {
  CommandHelp,
  CommandOption,
  CommandValidate
} from '../../../../Command';
import SpoCommand from '../../SpoCommand';

const vorpal: Vorpal = require('../../../../vorpal-init');

interface CommandArgs {
  options: Options;
}

interface Options extends VerboseOption {
  id: string;
  siteUrl: string;
}

class AppUpgradeCommand extends SpoCommand {
  public get name(): string {
    return commands.APP_UPGRADE;
  }

  public get description(): string {
    return 'Upgrades app in the specified site';
  }

  public commandAction(cmd: CommandInstance, args: CommandArgs, cb: () => void): void {
    const resource: string = Auth.getResourceFromUrl(args.options.siteUrl);
    let siteAccessToken: string = '';

    auth
      .getAccessToken(resource, auth.service.refreshToken as string, cmd, this.verbose)
      .then((accessToken: string): Promise<ContextInfo> => {
        siteAccessToken = accessToken;

        if (this.verbose) {
          cmd.log(`Retrieved access token ${accessToken}. Retrieving request digest...`);
        }

        return this.getRequestDigestForSite(args.options.siteUrl, siteAccessToken, cmd, this.verbose);
      })
      .then((res: ContextInfo): Promise<string> => {
        if (this.verbose) {
          cmd.log('Response:');
          cmd.log(res);
          cmd.log('');
        }

        cmd.log(`Upgrading app '${args.options.id}' in site '${args.options.siteUrl}'...`);

        const requestOptions: any = {
          url: `${args.options.siteUrl}/_api/web/tenantappcatalog/AvailableApps/GetById('${encodeURIComponent(args.options.id)}')/upgrade`,
          headers: {
            authorization: `Bearer ${auth.site.accessToken}`,
            accept: 'application/json;odata=nometadata',
            'X-RequestDigest': res.FormDigestValue
          }
        };

        if (this.verbose) {
          cmd.log('Executing web request...');
          cmd.log(requestOptions);
          cmd.log('');
        }

        return request.post(requestOptions);
      })
      .then((res: string): void => {
        if (this.verbose) {
          cmd.log('Response:');
          cmd.log(res);
          cmd.log('');
        }

        cb();
      }, (rawRes: any): void => {
        try {
          const res: any = JSON.parse(JSON.stringify(rawRes));
          if (res.error) {
            const err: ODataError = JSON.parse(res.error);
            if (err['odata.error']) {
              if (err['odata.error'].code === '-1, Microsoft.SharePoint.Client.ResourceNotFoundException') {
                cmd.log(vorpal.chalk.red(`Error: App with id ${args.options.id} not found`));
              }
              else {
                cmd.log(vorpal.chalk.red(`Error: ${err['odata.error'].message.value}`));
              }
            }
            else {
              cmd.log(vorpal.chalk.red(`Error: ${res.message}`));
            }
          }
          else {
            cmd.log(vorpal.chalk.red(`Error: ${rawRes}`));
          }
        }
        catch (e) {
          cmd.log(vorpal.chalk.red(`Error: ${rawRes}`));
        }

        cb();
      });
  }

  public options(): CommandOption[] {
    const options: CommandOption[] = [
      {
        option: '-i, --id <id>',
        description: 'ID of the app to retrieve information for'
      },
      {
        option: '-s, --siteUrl <siteUrl>',
        description: 'Absolute URL of the site to install the app in'
      }
    ];

    const parentOptions: CommandOption[] = super.options();
    return options.concat(parentOptions);
  }

  public validate(): CommandValidate {
    return (args: CommandArgs): boolean | string => {
      if (!args.options.id) {
        return 'Required parameter id missing';
      }

      if (!args.options.siteUrl) {
        return 'Required parameter siteUrl missing';
      }

      const isValidSharePointUrl: boolean | string = SpoCommand.isValidSharePointUrl(args.options.siteUrl);
      if (isValidSharePointUrl !== true) {
        return isValidSharePointUrl;
      }

      return true;
    };
  }

  public help(): CommandHelp {
    return function (args: {}, log: (help: string) => void): void {
      const chalk = vorpal.chalk;
      log(vorpal.find(commands.APP_UPGRADE).helpInformation());
      log(
        `  ${chalk.yellow('Important:')} before using this command, connect to a SharePoint Online site,
      using the ${chalk.blue(commands.CONNECT)} command.

  Remarks:
  
    To upgrade an app in the site, you have to first connect to a SharePoint site using
    the ${chalk.blue(commands.CONNECT)} command, eg. ${chalk.grey(`${config.delimiter} ${commands.CONNECT} https://contoso.sharepoint.com`)}.
 
  Examples:
  
    ${chalk.grey(config.delimiter)} ${commands.APP_UPGRADE} -i b2307a39-e878-458b-bc90-03bc578531d6 -s https://contoso.sharepoint.com
      Upgrades the app with ID ${chalk.grey('b2307a39-e878-458b-bc90-03bc578531d6')}
      in the ${chalk.grey('https://contoso.sharepoint.com')} site.

  More information:
  
    Application Lifecycle Management (ALM) APIs
      https://docs.microsoft.com/en-us/sharepoint/dev/apis/alm-api-for-spfx-add-ins
`);
    };
  }
}

module.exports = new AppUpgradeCommand();