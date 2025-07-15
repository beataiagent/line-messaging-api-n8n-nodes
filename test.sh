# To verify the URL set in the "Webhook URL" section of the LINE Developers Console
curl -X POST \
-H 'Authorization: Bearer {C+cnWWvekKl2ehZk6jwKWl8gPjoFZF+on4GVxOU5v+FiF7iBGGfv3yX+eYjkR/SObQU2vGpcsgpnnxvAP7jbeST5rn0qIzq3ReGHqJBEkUimuP5RzH//vg5+mayVpT9Sv48BooyyiWUxWgghqd/oXQdB04t89/1O/w1cDnyilFU=}' \
-H 'Content-Type:application/json' \
-d '{}' \
http://localhost:5678/webhook-test/line-webhook

Webhook Error: no signature% 