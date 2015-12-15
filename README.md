# Step 1
Checkout hope in the directory where gaia is checked out.

```shell
git clone https://github.com/etiennesegonzac/hope.git
ls
> gaia hope
```

# Step 2
Flash the alternate system app

```shell
cd gaia
adb root
APP=system make install-gaia
```
