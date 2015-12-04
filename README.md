# Step 1
Checkout the APZ-gambler in the directory where gaia is checked out.

```shell
git clone https://github.com/etiennesegonzac/APZ-gambler.git apz-gambler
ls
> gaia apz-gambler
```

# Step 2
Make the APZ-gambler ready for full screen, comment [those
lines](https://github.com/etiennesegonzac/APZ-gambler/blob/f3b18f5671580da85a27d1292424d7ce62be56e5/css/style.css#L18-L19).

# Step 3
Flash the alternate system app

```shell
cd gaia
adb root
NOFTU=1 DEVICE_DEBUG=1 make reset-gaia
```

# Emergency step
If anything goes wrong during a demo, just shake the phone to reload the
prototype.
