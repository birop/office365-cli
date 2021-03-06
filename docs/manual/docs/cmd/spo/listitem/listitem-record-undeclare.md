# spo listitem record undeclare

Undeclares list item as a record

## Usage

```sh
spo listitem record undeclare [options]
```

## Options

Option|Description
------|-----------
`--help`|output usage information
`-u, --webUrl <webUrl>`|The URL of the site where the list is located
`-i, --id <id>`|ID of the list item to be undeclared as a record.
`-l, --listId [listId]`|The ID of the list where the item is located. Specify `listId` or `listTitle` but not both
`-t, --listTitle [listTitle]`|The title of the list where the item is located. Specify `listId` or `listTitle` but not both
`-o, --output [output]`|Output type. json|text. Default text
`--verbose`|Runs command with verbose logging
`--debug`| Runs command with debug logging

!!! important
    Before using this command, log in to a SharePoint Online site, using the [spo login](../login.md) command.
  
## Remarks

To undeclare an item as a record in a list, you have to first log in to a SharePoint Online site using the [spo login](../login.md) command, eg. `spo login https://contoso.sharepoint.com`.

## Examples

Undeclare the list item as a record with ID _1_ from list with ID _0cd891ef-afce-4e55-b836-fce03286cccf_ located in site _https://contoso.sharepoint.com/sites/project-x

```sh_
spo listitem record undeclare --webUrl https://contoso.sharepoint.com/sites/project-x --listId 0cd891ef-afce-4e55-b836-fce03286cccf --id 1
```

Undeclare the list item as a record with ID _1_ from list with title _List 1_ located in site _https://contoso.sharepoint.com/sites/project-x_

```sh
spo listitem record undeclare --webUrl https://contoso.sharepoint.com/sites/project-x --listTitle 'List 1' --id 1
```