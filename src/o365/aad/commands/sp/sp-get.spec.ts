import commands from '../../commands';
import Command, { CommandOption, CommandValidate, CommandError } from '../../../../Command';
import * as sinon from 'sinon';
import appInsights from '../../../../appInsights';
import auth from '../../AadAuth';
const command: Command = require('./sp-get');
import * as assert from 'assert';
import * as request from 'request-promise-native';
import Utils from '../../../../Utils';
import { Service } from '../../../../Auth';

describe(commands.SP_GET, () => {
  let vorpal: Vorpal;
  let log: string[];
  let cmdInstance: any;
  let cmdInstanceLogSpy: sinon.SinonSpy;
  let trackEvent: any;
  let telemetry: any;

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(auth, 'ensureAccessToken').callsFake(() => { return Promise.resolve('ABC'); });
    trackEvent = sinon.stub(appInsights, 'trackEvent').callsFake((t) => {
      telemetry = t;
    });
  });

  beforeEach(() => {
    vorpal = require('../../../../vorpal-init');
    log = [];
    cmdInstance = {
      log: (msg: string) => {
        log.push(msg);
      }
    };
    cmdInstanceLogSpy = sinon.spy(cmdInstance, 'log');
    auth.service = new Service('https://graph.windows.net');
    telemetry = null;
  });

  afterEach(() => {
    Utils.restore([
      vorpal.find,
      request.get
    ]);
  });

  after(() => {
    Utils.restore([
      appInsights.trackEvent,
      auth.ensureAccessToken,
      auth.restoreAuth
    ]);
  });

  it('has correct name', () => {
    assert.equal(command.name.startsWith(commands.SP_GET), true);
  });

  it('has a description', () => {
    assert.notEqual(command.description, null);
  });

  it('calls telemetry', (done) => {
    cmdInstance.action = command.action();
    cmdInstance.action({ options: {} }, () => {
      try {
        assert(trackEvent.called);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('logs correct telemetry event', (done) => {
    cmdInstance.action = command.action();
    cmdInstance.action({ options: {} }, () => {
      try {
        assert.equal(telemetry.name, commands.SP_GET);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('aborts when not logged in to AAD Graph', (done) => {
    auth.service = new Service('https://graph.windows.net');
    auth.service.connected = false;
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: true } }, (err?: any) => {
      try {
        assert.equal(JSON.stringify(err), JSON.stringify(new CommandError('Log in to Azure Active Directory Graph first')));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('retrieves information about the specified service principal using its display name (debug)', (done) => {
    const sp: any = { "objectType": "ServicePrincipal", "objectId": "d03a0062-1aa6-43e1-8f49-d73e969c5812", "deletionTimestamp": null, "accountEnabled": true, "addIns": [], "alternativeNames": [], "appDisplayName": "SharePoint Online Client", "appId": "57fb890c-0dab-4253-a5e0-7188c88b2bb4", "appOwnerTenantId": null, "appRoleAssignmentRequired": false, "appRoles": [], "displayName": "SharePoint Online Client", "errorUrl": null, "homepage": null, "keyCredentials": [], "logoutUrl": null, "oauth2Permissions": [], "passwordCredentials": [], "preferredTokenSigningKeyThumbprint": null, "publisherName": null, "replyUrls": [], "samlMetadataUrl": null, "servicePrincipalNames": ["57fb890c-0dab-4253-a5e0-7188c88b2bb4"], "servicePrincipalType": "Application", "tags": [], "tokenEncryptionKeyId": null };

    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url.indexOf(`/myorganization/servicePrincipals?api-version=1.6&$filter=displayName eq 'SharePoint%20Online%20Client'`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.resolve({ value: [sp] });
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.service = new Service('https://graph.windows.net');
    auth.service.connected = true;
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: true, displayName: 'SharePoint Online Client' } }, () => {
      try {
        assert(cmdInstanceLogSpy.calledWith(sp));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('retrieves information about the specified service principal using its display name', (done) => {
    const sp: any = { "objectType": "ServicePrincipal", "objectId": "d03a0062-1aa6-43e1-8f49-d73e969c5812", "deletionTimestamp": null, "accountEnabled": true, "addIns": [], "alternativeNames": [], "appDisplayName": "SharePoint Online Client", "appId": "57fb890c-0dab-4253-a5e0-7188c88b2bb4", "appOwnerTenantId": null, "appRoleAssignmentRequired": false, "appRoles": [], "displayName": "SharePoint Online Client", "errorUrl": null, "homepage": null, "keyCredentials": [], "logoutUrl": null, "oauth2Permissions": [], "passwordCredentials": [], "preferredTokenSigningKeyThumbprint": null, "publisherName": null, "replyUrls": [], "samlMetadataUrl": null, "servicePrincipalNames": ["57fb890c-0dab-4253-a5e0-7188c88b2bb4"], "servicePrincipalType": "Application", "tags": [], "tokenEncryptionKeyId": null };

    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url.indexOf(`/myorganization/servicePrincipals?api-version=1.6&$filter=displayName eq 'SharePoint%20Online%20Client'`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.resolve({ value: [sp] });
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.service = new Service('https://graph.windows.net');
    auth.service.connected = true;
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: false, displayName: 'SharePoint Online Client' } }, () => {
      try {
        assert(cmdInstanceLogSpy.calledWith(sp));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('retrieves information about the specified service principal using its appId', (done) => {
    const sp: any = { "objectType": "ServicePrincipal", "objectId": "d03a0062-1aa6-43e1-8f49-d73e969c5812", "deletionTimestamp": null, "accountEnabled": true, "addIns": [], "alternativeNames": [], "appDisplayName": "SharePoint Online Client", "appId": "57fb890c-0dab-4253-a5e0-7188c88b2bb4", "appOwnerTenantId": null, "appRoleAssignmentRequired": false, "appRoles": [], "displayName": "SharePoint Online Client", "errorUrl": null, "homepage": null, "keyCredentials": [], "logoutUrl": null, "oauth2Permissions": [], "passwordCredentials": [], "preferredTokenSigningKeyThumbprint": null, "publisherName": null, "replyUrls": [], "samlMetadataUrl": null, "servicePrincipalNames": ["57fb890c-0dab-4253-a5e0-7188c88b2bb4"], "servicePrincipalType": "Application", "tags": [], "tokenEncryptionKeyId": null };

    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url.indexOf(`/myorganization/servicePrincipals?api-version=1.6&$filter=appId eq '57fb890c-0dab-4253-a5e0-7188c88b2bb4'`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.resolve({ value: [sp] });
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.service = new Service('https://graph.windows.net');
    auth.service.connected = true;
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: false, appId: '57fb890c-0dab-4253-a5e0-7188c88b2bb4' } }, () => {
      try {
        assert(cmdInstanceLogSpy.calledWith(sp));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('correctly handles no service principal found', (done) => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url.indexOf(`/myorganization/servicePrincipals?api-version=1.6&$filter=displayName eq 'Foo'`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.resolve({ value: [] });
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.service = new Service('https://graph.windows.net');
    auth.service.connected = true;
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: false, displayName: 'Foo' } }, () => {
      try {
        assert(cmdInstanceLogSpy.notCalled);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('correctly handles API OData error', (done) => {
    sinon.stub(request, 'get').callsFake((opts) => {
      return Promise.reject({
        error: {
          'odata.error': {
            code: '-1, InvalidOperationException',
            message: {
              value: 'An error has occurred'
            }
          }
        }
      });
    });

    auth.service = new Service('https://graph.windows.net');
    auth.service.connected = true;
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: false, id: 'b2307a39-e878-458b-bc90-03bc578531d6' } }, (err?: any) => {
      try {
        assert.equal(JSON.stringify(err), JSON.stringify(new CommandError('An error has occurred')));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('fails validation if neither the appId nor the displayName option specified', () => {
    const actual = (command.validate() as CommandValidate)({ options: {} });
    assert.notEqual(actual, true);
  });

  it('fails validation if the appId is not a valid GUID', () => {
    const actual = (command.validate() as CommandValidate)({ options: { appId: '123' } });
    assert.notEqual(actual, true);
  });

  it('passes validation when the appId option specified', () => {
    const actual = (command.validate() as CommandValidate)({ options: { appId: '6a7b1395-d313-4682-8ed4-65a6265a6320' } });
    assert.equal(actual, true);
  });

  it('passes validation when the displayName option specified', () => {
    const actual = (command.validate() as CommandValidate)({ options: { displayName: 'Microsoft Graph' } });
    assert.equal(actual, true);
  });

  it('fails validation when both the appId and displayName are specified', () => {
    const actual = (command.validate() as CommandValidate)({ options: { appId: '6a7b1395-d313-4682-8ed4-65a6265a6320', displayName: 'Microsoft Graph' } });
    assert.notEqual(actual, true);
  });

  it('supports debug mode', () => {
    const options = (command.options() as CommandOption[]);
    let containsOption = false;
    options.forEach(o => {
      if (o.option === '--debug') {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('supports specifying appId', () => {
    const options = (command.options() as CommandOption[]);
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--appId') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('supports specifying displayName', () => {
    const options = (command.options() as CommandOption[]);
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--displayName') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('has help referring to the right command', () => {
    const cmd: any = {
      log: (msg: string) => { },
      prompt: () => { },
      helpInformation: () => { }
    };
    const find = sinon.stub(vorpal, 'find').callsFake(() => cmd);
    cmd.help = command.help();
    cmd.help({}, () => { });
    assert(find.calledWith(commands.SP_GET));
  });

  it('has help with examples', () => {
    const _log: string[] = [];
    const cmd: any = {
      log: (msg: string) => {
        _log.push(msg);
      },
      prompt: () => { },
      helpInformation: () => { }
    };
    sinon.stub(vorpal, 'find').callsFake(() => cmd);
    cmd.help = command.help();
    cmd.help({}, () => { });
    let containsExamples: boolean = false;
    _log.forEach(l => {
      if (l && l.indexOf('Examples:') > -1) {
        containsExamples = true;
      }
    });
    Utils.restore(vorpal.find);
    assert(containsExamples);
  });

  it('correctly handles lack of valid access token', (done) => {
    Utils.restore(auth.ensureAccessToken);
    sinon.stub(auth, 'ensureAccessToken').callsFake(() => { return Promise.reject(new Error('Error getting access token')); });
    auth.service = new Service('https://graph.windows.net');
    auth.service.connected = true;
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: true } }, (err?: any) => {
      try {
        assert.equal(JSON.stringify(err), JSON.stringify(new CommandError('Error getting access token')));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });
});