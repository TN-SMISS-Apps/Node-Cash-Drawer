
# Default port is `3333`.
<br>

## Open Cash Drawer Request
Use to open cash drawer.

**URL** : `/cash-drawer/open`

**Method** : `POST`

**Example** : `curl -X POST http://localhost:3333/cash-drawer/open`

**Data constraints**

```
Body not required.
```

## Success Response

**Code** : `200 OK`

**Content example**

```json
{
   "message_sent" : true
}
```

## Error Response

**Condition** : COM port failed to open / receive message.

**Code** : `409`

**Content** :

```json
{
    "error_code": "COM_PORT",
    "message": "Error: Resource busy, cannot open /dev/tty.sAirPods-WirelessiAP",
    "error": {}
}
```
