import os
from setuptools import setup, find_packages

setup(
    name='ptz-server',
    version='0.1',
    author='Gary Smith',
    author_email='garysmith123@gmail.com',
    packages=find_packages(),
    include_package_data=True,
    license='Apache-2.0',
    description='PTZ Server',
    install_requires=[],
    zip_safe=False,
)
