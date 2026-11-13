import fcntl, os, pty, select, signal, sys, termios, tty

fifo, argv = sys.argv[1], sys.argv[2:]
pid, fd = pty.fork()
if pid == 0:
    os.execvp(argv[0], argv)


def resize(*_):
    fcntl.ioctl(fd, termios.TIOCSWINSZ, fcntl.ioctl(0, termios.TIOCGWINSZ, b"\0" * 8))


resize()
signal.signal(signal.SIGWINCH, resize)
saved = termios.tcgetattr(0)
tty.setraw(0)
inject = os.open(fifo, os.O_RDWR | os.O_NONBLOCK)
try:
    while True:
        ready = select.select([0, fd, inject], [], [])[0]
        if fd in ready:
            try:
                data = os.read(fd, 65536)
            except OSError:
                break
            if not data:
                break
            os.write(1, data)
        for src in (0, inject):
            if src in ready:
                os.write(fd, os.read(src, 65536))
finally:
    termios.tcsetattr(0, termios.TCSAFLUSH, saved)
    os.waitpid(pid, 0)
